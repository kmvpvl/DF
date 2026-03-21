import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import express, { type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import cors, { type CorsOptions } from 'cors';
import session from 'express-session';
import nodemailer from 'nodemailer';
import 'dotenv/config';

function createPrismaAdapter(): PrismaMariaDb {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL is not a valid URL');
  }

  if (!['mysql:', 'mariadb:'].includes(parsedUrl.protocol)) {
    throw new Error(
      `Unsupported database protocol "${parsedUrl.protocol}". Use mysql:// or mariadb://`
    );
  }

  const databaseName = decodeURIComponent(parsedUrl.pathname.replace(/^\//, ''));
  if (!databaseName) {
    throw new Error('DATABASE_URL must include a database name');
  }

  return new PrismaMariaDb({
    host: parsedUrl.hostname,
    port: parsedUrl.port ? Number.parseInt(parsedUrl.port, 10) : 3306,
    user: decodeURIComponent(parsedUrl.username),
    password: decodeURIComponent(parsedUrl.password),
    database: databaseName,
  });
}

const prisma = new PrismaClient({
  adapter: createPrismaAdapter(),
  log: ['query', 'error', 'warn'],
});
const DEFAULT_SESSION_DURATION_MINUTES = 2880; // 48 hours

function getSessionDurationMinutes(): number {
  const raw = process.env.SESSION_DURATION_MINUTES;
  if (!raw) {
    return DEFAULT_SESSION_DURATION_MINUTES;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_SESSION_DURATION_MINUTES;
  }

  return parsed;
}

const SESSION_TTL_MS = getSessionDurationMinutes() * 60 * 1000;

interface GraphQLContext {
  req: Request;
  res: Response;
}

interface CreateUserInput {
  name: string;
  fullName: string;
  entityType?: 'INDIVIDUAL' | 'LEGAL_ENTITY';
  phone?: string;
  email: string;
  bio?: string;
  tgId?: string;
  pib?: string;
  mbr?: string;
  account?: string;
  bank?: string;
  password: string;
}

interface UpdateSessionUserInput {
  name: string;
  fullName: string;
  entityType?: 'INDIVIDUAL' | 'LEGAL_ENTITY';
  phone?: string | null;
  email: string;
  pib?: string | null;
  mbr?: string | null;
  account?: string | null;
  bank?: string | null;
}

interface SendContactMessageInput {
  type: 'FEEDBACK' | 'FREE_TEST_BATCH';
  name: string;
  email?: string;
  phone?: string;
  subject: string;
  message: string;
}

interface OrderItemInput {
  productId: number;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  variationLabel?: string;
  weightGrams?: number;
}

interface CreateEquipmentInput {
  numId: number;
  fullName: string;
}

interface UpdateEquipmentInput {
  numId?: number;
  fullName?: string;
}

interface CreateCleanActionInput {
  equipmentId: string;
  performerId: string;
  supervisorId: string;
  cleaningType: 'GENERAL' | 'CURRENT' | 'DISINFECTION';
}

interface SendOrderInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  note?: string;
  items: OrderItemInput[];
  total: number;
}

let smtpTransporter: nodemailer.Transporter | null = null;

function parseBoolean(value: string | undefined, fallback = false): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function getSmtpTransporter(): nodemailer.Transporter {
  if (smtpTransporter) {
    return smtpTransporter;
  }

  const host = process.env.SMTP_HOST;
  const port = Number.parseInt(process.env.SMTP_PORT ?? '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = parseBoolean(process.env.SMTP_SECURE, false);

  if (!host || !Number.isFinite(port) || !user || !pass) {
    throw new Error(
      'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS.'
    );
  }

  smtpTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  return smtpTransporter;
}

const typeDefs = `
  enum EntityType {
    INDIVIDUAL
    LEGAL_ENTITY
  }

  enum ContactRequestType {
    FEEDBACK
    FREE_TEST_BATCH
  }

  type User {
    id: ID!
    name: String!
    fullName: String!
    entityType: EntityType!
    phone: String
    email: String!
    bio: String
    tgId: String
    pib: String
    mbr: String
    account: String
    bank: String
    passwordHash: String!
    createdAt: String!
    updatedAt: String!
  }

  input CreateUserInput {
    name: String!
    fullName: String!
    entityType: EntityType
    phone: String
    email: String!
    bio: String
    tgId: String
    pib: String
    mbr: String
    account: String
    bank: String
    password: String!
  }

  input SendContactMessageInput {
    type: ContactRequestType!
    name: String!
    email: String
    phone: String
    subject: String!
    message: String!
  }

  input OrderItemInput {
    productId: Int!
    name: String!
    qty: Int!
    unitPrice: Float!
    lineTotal: Float!
    variationLabel: String
    weightGrams: Float
  }

  input SendOrderInput {
    customerName: String!
    customerEmail: String!
    customerPhone: String!
    note: String
    items: [OrderItemInput!]!
    total: Float!
  }

  input UpdateSessionUserInput {
    name: String!
    fullName: String!
    entityType: EntityType
    phone: String
    email: String!
    pib: String
    mbr: String
    account: String
    bank: String
  }

  enum CleaningType {
    GENERAL
    CURRENT
    DISINFECTION
  }

  type Equipment {
    id: ID!
    numId: Int!
    fullName: String!
    createdAt: String!
    updatedAt: String!
  }

  type CleanAction {
    id: ID!
    equipment: Equipment!
    performer: User!
    supervisor: User!
    cleaningType: CleaningType!
    createdAt: String!
    updatedAt: String!
  }

  input CreateEquipmentInput {
    numId: Int!
    fullName: String!
  }

  input UpdateEquipmentInput {
    numId: Int
    fullName: String
  }

  input CreateCleanActionInput {
    equipmentId: ID!
    performerId: ID!
    supervisorId: ID!
    cleaningType: CleaningType!
  }

  type Query {
    hello: String
    userById(id: ID!): User!
    userInfo(id: ID, email: String): User
    sessionUser: User
    equipments: [Equipment!]!
    users: [User!]!
    cleanActions(cleaningType: CleaningType, fromDate: String, toDate: String): [CleanAction!]!
  }

  type Mutation {
    createUser(input: CreateUserInput!): User!
    login(email: String!, password: String!): User!
    updateSessionUser(input: UpdateSessionUserInput!): User!
    sendContactMessage(input: SendContactMessageInput!): Boolean!
    sendOrderByEmail(input: SendOrderInput!): Boolean!
    createEquipment(input: CreateEquipmentInput!): Equipment!
    updateEquipment(id: ID!, input: UpdateEquipmentInput!): Equipment!
    deleteEquipment(id: ID!): Boolean!
    createCleanAction(input: CreateCleanActionInput!): CleanAction!
  }
`;

const resolvers = {
  Query: {
    hello: () => 'DolceForte API',
    userById: async (_: unknown, { id }: { id: string }) => {
      return await prisma.user.findFirst({ where: { id } });
    },
    userInfo: async (
      _: unknown,
      { id, email }: { id?: string; email?: string }
    ) => {
      if (!id && !email) {
        throw new Error('Provide id or email');
      }

      if (id && email) {
        throw new Error('Provide only one unique identifier: id or email');
      }

      if (id) {
        return await prisma.user.findUnique({ where: { id } });
      }

      return await prisma.user.findUnique({ where: { email: email! } });
    },
    equipments: async (_: unknown, __: unknown, { req }: GraphQLContext) => {
      if (!req.session.userId) throw new Error('Not authenticated');
      return await prisma.equipment.findMany({ orderBy: { numId: 'asc' } });
    },
    users: async (_: unknown, __: unknown, { req }: GraphQLContext) => {
      if (!req.session.userId) throw new Error('Not authenticated');
      return await prisma.user.findMany({ orderBy: { name: 'asc' } });
    },
    cleanActions: async (
      _: unknown,
      { cleaningType, fromDate, toDate }: { cleaningType?: string; fromDate?: string; toDate?: string },
      { req }: GraphQLContext
    ) => {
      if (!req.session.userId) throw new Error('Not authenticated');
      const where: Record<string, unknown> = {};
      if (cleaningType) where.cleaningType = cleaningType;
      if (fromDate || toDate) {
        const dateFilter: Record<string, Date> = {};
        if (fromDate) dateFilter.gte = new Date(fromDate);
        if (toDate) {
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          dateFilter.lte = end;
        }
        where.createdAt = dateFilter;
      }
      return await prisma.cleanAction.findMany({
        where,
        include: { equipmend: true, performer: true, supervisor: true },
        orderBy: { createdAt: 'desc' },
      });
    },
    sessionUser: async (_: unknown, __: unknown, { req }: GraphQLContext) => {
      const userId = req.session.userId;
      if (!userId) {
        return null;
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        req.session.userId = undefined;
        await new Promise<void>((resolve, reject) => {
          req.session.save(error => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        });
        return null;
      }

      return user;
    },
  },
  Mutation: {
    login: async (
      _: unknown,
      { email, password }: { email: string; password: string },
      { req }: GraphQLContext
    ) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error('Invalid email or password');
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) throw new Error('Invalid email or password');

      req.session.userId = user.id;
      await new Promise<void>((resolve, reject) => {
        req.session.save(error => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });

      return user;
    },
    createUser: async (
      _: unknown,
      { input }: { input: CreateUserInput },
      { req }: GraphQLContext
    ) => {
      const entityType = input.entityType ?? 'INDIVIDUAL';
      const needsLegalEntityData = entityType === 'LEGAL_ENTITY';
      const requiredLegalEntityFields: Array<keyof Pick<
        CreateUserInput,
        'pib' | 'mbr' | 'account' | 'bank'
      >> = ['pib', 'mbr', 'account', 'bank'];

      if (needsLegalEntityData) {
        const missing = requiredLegalEntityFields.filter(field => {
          const value = input[field];
          return !value || value.trim().length === 0;
        });

        if (missing.length > 0) {
          throw new Error(
            `Missing required legal entity fields: ${missing.join(', ')}`
          );
        }
      }

      const { password, ...userData } = input;
      const passwordHash = await bcrypt.hash(password, 10);
      const data = {
        ...userData,
        entityType,
        passwordHash,
      };

      const user = await prisma.user.create({
        data,
      });

      req.session.userId = user.id;
      await new Promise<void>((resolve, reject) => {
        req.session.save(error => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });

      return user;
    },
    updateSessionUser: async (
      _: unknown,
      { input }: { input: UpdateSessionUserInput },
      { req }: GraphQLContext
    ) => {
      const userId = req.session.userId;
      if (!userId) {
        throw new Error('Not authenticated');
      }

      const entityType = input.entityType ?? 'INDIVIDUAL';
      const requiredLegalEntityFields: Array<keyof Pick<
        UpdateSessionUserInput,
        'pib' | 'mbr' | 'account' | 'bank'
      >> = ['pib', 'mbr', 'account', 'bank'];

      if (entityType === 'LEGAL_ENTITY') {
        const missing = requiredLegalEntityFields.filter(field => {
          const value = input[field];
          return !value || value.trim().length === 0;
        });

        if (missing.length > 0) {
          throw new Error(
            `Missing required legal entity fields: ${missing.join(', ')}`
          );
        }
      }

      const updateData = {
        name: input.name,
        fullName: input.fullName,
        entityType,
        email: input.email,
        phone: input.phone || null,
        pib: entityType === 'LEGAL_ENTITY' ? input.pib || null : null,
        mbr: entityType === 'LEGAL_ENTITY' ? input.mbr || null : null,
        account: entityType === 'LEGAL_ENTITY' ? input.account || null : null,
        bank: entityType === 'LEGAL_ENTITY' ? input.bank || null : null,
      } as any;

      return await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    },
    sendContactMessage: async (
      _: unknown,
      { input }: { input: SendContactMessageInput }
    ) => {
      const name = input.name.trim();
      const subject = input.subject.trim();
      const message = input.message.trim();
      const email = input.email?.trim();
      const phone = input.phone?.trim();

      if (!name) {
        throw new Error('Name is required');
      }

      if (!subject) {
        throw new Error('Subject is required');
      }

      if (!message) {
        throw new Error('Message is required');
      }

      if (!email && !phone) {
        throw new Error('Provide at least email or phone');
      }

      const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
      const feedbackTo =
        process.env.SMTP_TO_FEEDBACK || process.env.CONTACT_EMAIL_TO;
      const freeOrderTo =
        process.env.SMTP_TO_FREE_ORDER || process.env.CONTACT_EMAIL_TO;
      const recipient =
        input.type === 'FREE_TEST_BATCH' ? freeOrderTo : feedbackTo;

      if (!fromAddress || !recipient) {
        throw new Error(
          'Email routing is not configured. Set SMTP_FROM and CONTACT_EMAIL_TO or SMTP_TO_*.'
        );
      }

      const prefix = process.env.EMAIL_SUBJECT_PREFIX?.trim();
      const typeLabel =
        input.type === 'FREE_TEST_BATCH' ? 'FREE_TEST_BATCH' : 'FEEDBACK';
      const finalSubject = `${prefix ? `${prefix} ` : ''}[${typeLabel}] ${subject}`;

      const transporter = getSmtpTransporter();

      await transporter.sendMail({
        from: fromAddress,
        to: recipient,
        replyTo: email || undefined,
        subject: finalSubject,
        text: [
          `Type: ${typeLabel}`,
          `Name: ${name}`,
          `Email: ${email || '-'}`,
          `Phone: ${phone || '-'}`,
          '',
          message,
        ].join('\n'),
      });

      return true;
    },
    createEquipment: async (
      _: unknown,
      { input }: { input: CreateEquipmentInput },
      { req }: GraphQLContext
    ) => {
      if (!req.session.userId) throw new Error('Not authenticated');
      return await prisma.equipment.create({ data: input });
    },
    updateEquipment: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateEquipmentInput },
      { req }: GraphQLContext
    ) => {
      if (!req.session.userId) throw new Error('Not authenticated');
      const data: { numId?: number; fullName?: string } = {};
      if (input.numId !== undefined) data.numId = input.numId;
      if (input.fullName !== undefined) data.fullName = input.fullName;
      return await prisma.equipment.update({ where: { id }, data });
    },
    deleteEquipment: async (
      _: unknown,
      { id }: { id: string },
      { req }: GraphQLContext
    ) => {
      if (!req.session.userId) throw new Error('Not authenticated');
      await prisma.equipment.delete({ where: { id } });
      return true;
    },
    createCleanAction: async (
      _: unknown,
      { input }: { input: CreateCleanActionInput },
      { req }: GraphQLContext
    ) => {
      if (!req.session.userId) throw new Error('Not authenticated');
      return await prisma.cleanAction.create({
        data: {
          equipmentId: input.equipmentId,
          performerId: input.performerId,
          supervisorId: input.supervisorId,
          cleaningType: input.cleaningType,
        },
        include: { equipmend: true, performer: true, supervisor: true },
      });
    },
    sendOrderByEmail: async (
      _: unknown,
      { input }: { input: SendOrderInput },
      { req }: GraphQLContext
    ) => {
      const customerName = input.customerName.trim();
      const customerEmail = input.customerEmail.trim();
      const customerPhone = input.customerPhone.trim();
      const note = input.note?.trim();

      if (!customerName || !customerEmail || !customerPhone) {
        throw new Error('Customer name, email and phone are required');
      }

      if (!input.items.length) {
        throw new Error('Order must contain at least one item');
      }

      const invalidItem = input.items.find(
        item =>
          !item.name.trim() ||
          !Number.isFinite(item.qty) ||
          item.qty <= 0 ||
          !Number.isFinite(item.unitPrice) ||
          item.unitPrice < 0 ||
          !Number.isFinite(item.lineTotal) ||
          item.lineTotal < 0
      );

      if (invalidItem) {
        throw new Error('Order contains invalid item data');
      }

      if (!Number.isFinite(input.total) || input.total <= 0) {
        throw new Error('Order total must be greater than 0');
      }

      const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
      const recipient = process.env.SMTP_TO_ORDER || 'sales@dolceforte.rs';

      if (!fromAddress) {
        throw new Error('SMTP sender is not configured. Set SMTP_FROM or SMTP_USER.');
      }

      const transporter = getSmtpTransporter();
      const subjectPrefix = process.env.EMAIL_SUBJECT_PREFIX?.trim();
      const subject = `${subjectPrefix ? `${subjectPrefix} ` : ''}[ORDER] ${customerName}`;

      const sessionUserId = req.session.userId;
      const sessionUser = sessionUserId
        ? await prisma.user.findUnique({ where: { id: sessionUserId } })
        : null;

      const orderLines = input.items.map((item, index) => {
        const attributes = [
          item.variationLabel ? `variation: ${item.variationLabel}` : null,
          typeof item.weightGrams === 'number' && Number.isFinite(item.weightGrams)
            ? `weight: ${item.weightGrams}g`
            : null,
        ]
          .filter(Boolean)
          .join(', ');

        return [
          `${index + 1}. ${item.name}`,
          `   qty: ${item.qty}`,
          `   unit price: ${item.unitPrice.toFixed(2)} din`,
          `   line total: ${item.lineTotal.toFixed(2)} din`,
          attributes ? `   ${attributes}` : null,
        ]
          .filter(Boolean)
          .join('\n');
      });

      await transporter.sendMail({
        from: fromAddress,
        to: recipient,
        replyTo: customerEmail,
        subject,
        text: [
          'New DolceForte order',
          '',
          `Customer name: ${customerName}`,
          `Customer email: ${customerEmail}`,
          `Customer phone: ${customerPhone}`,
          `Session user id: ${sessionUser?.id ?? '-'}`,
          `Session user entity type: ${sessionUser?.entityType ?? '-'}`,
          '',
          'Order items:',
          ...orderLines,
          '',
          `Total: ${input.total.toFixed(2)} din`,
          `Note: ${note || '-'}`,
        ].join('\n'),
      });

      return true;
    },
  },
  User: {
    createdAt: (user: { createdAt: Date | string }) => {
      return new Date(user.createdAt).toISOString();
    },
    updatedAt: (user: { updatedAt: Date | string }) => {
      return new Date(user.updatedAt).toISOString();
    },
  },
  Equipment: {
    createdAt: (e: { createdAt: Date | string }) => new Date(e.createdAt).toISOString(),
    updatedAt: (e: { updatedAt: Date | string }) => new Date(e.updatedAt).toISOString(),
  },
  CleanAction: {
    equipment: (parent: { equipmend: unknown }) => parent.equipmend,
    performer: (parent: { performer: unknown }) => parent.performer,
    supervisor: (parent: { supervisor: unknown }) => parent.supervisor,
    createdAt: (parent: { createdAt: Date | string }) => new Date(parent.createdAt).toISOString(),
    updatedAt: (parent: { updatedAt: Date | string }) => new Date(parent.updatedAt).toISOString(),
  },
};

const app = express();
const port = process.env.PORT || 5000;

const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const allowedOrigins =
  configuredOrigins.length > 0
    ? configuredOrigins
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://www.dolceforte.rs',
        'https://dolceforte.rs',
        'http://dolceforte.local',
        'http://www.dolceforte.local',
      ];

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Allow same-origin or non-browser requests (e.g. curl/Postman without Origin).
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(
  session({
    name: 'dolceforte.sid',
    secret: process.env.SESSION_SECRET || 'dev-session-secret-change-me',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_TTL_MS,
    },
  })
);

app.get('/', (req, res) => {
  res.json({ message: 'DolceForte API' });
});

export default app;

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

(async () => {
  try {
    await prisma.$connect();
    console.log('Prisma connected');
  } catch (error) {
    console.error('Prisma failed to start. Check DATABASE_URL and DB availability.');
    console.error(error);
    process.exit(1);
  }

  await server.start();

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req, res }) => ({ req, res }),
    })
  );

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`GraphQL playground at http://localhost:${port}/graphql`);
  });
})();
