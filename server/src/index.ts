import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import { PrismaClient } from '@prisma/client';
import express, { type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import cors, { type CorsOptions } from 'cors';
import session from 'express-session';
import nodemailer from 'nodemailer';
import 'dotenv/config';

const prisma = new PrismaClient();
const DEFAULT_SESSION_DURATION_MINUTES = 15;

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

interface SendContactMessageInput {
  type: 'FEEDBACK' | 'FREE_TEST_BATCH';
  name: string;
  email?: string;
  phone?: string;
  subject: string;
  message: string;
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

  type Query {
    hello: String
    userById(id: ID!): User!
    userInfo(id: ID, email: String): User
    sessionUser: User
  }

  type Mutation {
    createUser(input: CreateUserInput!): User!
    login(email: String!, password: String!): User!
    sendContactMessage(input: SendContactMessageInput!): Boolean!
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
  },
  User: {
    createdAt: (user: { createdAt: Date | string }) => {
      return new Date(user.createdAt).toISOString();
    },
    updatedAt: (user: { updatedAt: Date | string }) => {
      return new Date(user.updatedAt).toISOString();
    },
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
