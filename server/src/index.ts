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

interface CreateMaterialInput {
  name: string;
  description?: string;
  selfProduced: boolean;
  caloriesKcal: number;
  fatGrams: number;
  proteinGrams: number;
  carbohydratesGrams: number;
  sugarsGrams: number;
  fiberGrams: number;
  saltGrams: number;
  VAT: number;
  Price: number;
  purchaseUnit: string;
  purchaseUnitAmount: number;
  consumptionUnit: string;
  ratio: number;
}

interface UpdateMaterialInput {
  name?: string;
  description?: string;
  selfProduced?: boolean;
  caloriesKcal?: number;
  fatGrams?: number;
  proteinGrams?: number;
  carbohydratesGrams?: number;
  sugarsGrams?: number;
  fiberGrams?: number;
  saltGrams?: number;
  VAT?: number;
  Price?: number;
  purchaseUnit?: string;
  purchaseUnitAmount?: number;
  consumptionUnit?: string;
  ratio?: number;
}

interface CreateProductInput {
  name: string;
  batchPrefix: string;
  description?: string;
  caloriesKcal: number;
  fatGrams: number;
  proteinGrams: number;
  carbohydratesGrams: number;
  sugarsGrams: number;
  fiberGrams: number;
  saltGrams: number;
}

interface UpdateProductInput {
  name?: string;
  batchPrefix?: string;
  description?: string;
  caloriesKcal?: number;
  fatGrams?: number;
  proteinGrams?: number;
  carbohydratesGrams?: number;
  sugarsGrams?: number;
  fiberGrams?: number;
  saltGrams?: number;
}

interface CreateBatchInput {
  productId: string;
  nettoWeight: number;
  storageDurationHours: number;
  storageConditionId?: string;
  storageConditionName?: string;
  processDeviations?: string;
  processMapId?: string;
  sampleCount?: number;
}

interface UpdateBatchInput {
  nettoWeight?: number;
  storageDurationHours?: number;
  storageConditionId?: string;
  storageConditionName?: string;
  processDeviations?: string;
  processMapId?: string | null;
}

interface CreateProcessParameterInput {
  name: string;
  value: string;
  unit: string;
}

interface IngredientInput {
  productId?: string;
  materialId?: string;
  amount: number;
}

interface CreateProcessMapInput {
  productId: string;
  name: string;
  outcome: number;
  rateOfLoss?: number;
  VAT?: number;
  containerCost?: number;
  weight?: number;
  marginalCoefficient?: number;
  parameters?: CreateProcessParameterInput[];
  ingredients?: IngredientInput[];
}

interface UpdateProcessMapInput {
  name?: string;
  outcome?: number;
  rateOfLoss?: number;
  VAT?: number;
  containerCost?: number;
  weight?: number;
  marginalCoefficient?: number;
  parameters?: CreateProcessParameterInput[];
  ingredients?: IngredientInput[];
}

interface ImportMaterialsCsvResult {
  importedCount: number;
  skippedCount: number;
  errors: string[];
}

interface ImportProductsCsvResult {
  importedCount: number;
  skippedCount: number;
  errors: string[];
}

interface BatchNumberPreview {
  number: number;
  numberStr: string;
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

const MATERIAL_CSV_HEADERS = [
  'name',
  'description',
  'selfProduced',
  'caloriesKcal',
  'fatGrams',
  'proteinGrams',
  'carbohydratesGrams',
  'sugarsGrams',
  'fiberGrams',
  'saltGrams',
  'VAT',
  'Price',
  'purchaseUnit',
  'purchaseUnitAmount',
  'consumptionUnit',
  'ratio',
] as const;

const PRODUCT_CSV_HEADERS = [
  'name',
  'batchPrefix',
  'description',
  'caloriesKcal',
  'fatGrams',
  'proteinGrams',
  'carbohydratesGrams',
  'sugarsGrams',
  'fiberGrams',
  'saltGrams',
] as const;

type MaterialCsvHeader = (typeof MATERIAL_CSV_HEADERS)[number];
type ProductCsvHeader = (typeof PRODUCT_CSV_HEADERS)[number];

function escapeCsvValue(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        currentValue += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ';' && !inQuotes) {
      currentRow.push(currentValue);
      currentValue = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        i += 1;
      }

      currentRow.push(currentValue);
      const hasNonEmptyValue = currentRow.some(value => value.trim().length > 0);
      if (hasNonEmptyValue) {
        rows.push(currentRow);
      }

      currentRow = [];
      currentValue = '';
      continue;
    }

    currentValue += char;
  }

  if (inQuotes) {
    throw new Error('CSV contains unclosed quoted value');
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue);
    const hasNonEmptyValue = currentRow.some(value => value.trim().length > 0);
    if (hasNonEmptyValue) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function parseCsvBoolean(rawValue: string): boolean {
  const normalized = rawValue.trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', ''].includes(normalized)) {
    return false;
  }

  throw new Error(`Invalid boolean value "${rawValue}"`);
}

function parseCsvNumber(rawValue: string): number {
  const normalized = rawValue.trim();
  if (!normalized) {
    throw new Error('Value is required');
  }

  const decimalNormalized = /^-?\d+,\d+$/.test(normalized)
    ? normalized.replace(',', '.')
    : normalized;
  const parsed = Number.parseFloat(decimalNormalized);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid number value "${rawValue}"`);
  }

  return parsed;
}

function buildMaterialCsvRows(
  rows: string[][]
): Array<Record<MaterialCsvHeader, string>> {
  if (rows.length === 0) {
    throw new Error('CSV is empty');
  }

  const headerRow = rows[0].map(header => header.trim());
  const headerIndexes = new Map<string, number>();
  headerRow.forEach((header, index) => {
    headerIndexes.set(header.toLowerCase(), index);
  });

  const missingHeaders = MATERIAL_CSV_HEADERS.filter(
    header => !headerIndexes.has(header.toLowerCase())
  );
  if (missingHeaders.length > 0) {
    throw new Error(`Missing CSV headers: ${missingHeaders.join(', ')}`);
  }

  return rows.slice(1).map(row => {
    const normalized = {} as Record<MaterialCsvHeader, string>;
    MATERIAL_CSV_HEADERS.forEach(header => {
      const index = headerIndexes.get(header.toLowerCase());
      normalized[header] = index === undefined ? '' : (row[index] ?? '').trim();
    });
    return normalized;
  });
}

function buildProductCsvRows(
  rows: string[][]
): Array<Record<ProductCsvHeader, string>> {
  if (rows.length === 0) {
    throw new Error('CSV is empty');
  }

  const headerRow = rows[0].map(header => header.trim());
  const headerIndexes = new Map<string, number>();
  headerRow.forEach((header, index) => {
    headerIndexes.set(header.toLowerCase(), index);
  });

  const missingHeaders = PRODUCT_CSV_HEADERS.filter(
    header => !headerIndexes.has(header.toLowerCase())
  );
  if (missingHeaders.length > 0) {
    throw new Error(`Missing CSV headers: ${missingHeaders.join(', ')}`);
  }

  return rows.slice(1).map(row => {
    const normalized = {} as Record<ProductCsvHeader, string>;
    PRODUCT_CSV_HEADERS.forEach(header => {
      const index = headerIndexes.get(header.toLowerCase());
      normalized[header] = index === undefined ? '' : (row[index] ?? '').trim();
    });
    return normalized;
  });
}

function getYearRange(date: Date): { start: Date; end: Date } {
  const year = date.getFullYear();
  return {
    start: new Date(year, 0, 1, 0, 0, 0, 0),
    end: new Date(year, 11, 31, 23, 59, 59, 999),
  };
}

function formatBatchNumberString(date: Date, batchPrefix: string, batchNumber: number): string {
  const shortYear = String(date.getFullYear()).slice(-2);
  return `${shortYear}/${batchPrefix}/${batchNumber}`;
}

async function getNextBatchPreview(productId: string, date = new Date()): Promise<BatchNumberPreview> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new Error('Product not found');
  }

  const { start, end } = getYearRange(date);
  const aggregate = await prisma.batch.aggregate({
    where: {
      productId,
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    _max: {
      number: true,
    },
  });

  const nextNumber = (aggregate._max.number ?? 0) + 1;
  return {
    number: nextNumber,
    numberStr: formatBatchNumberString(date, product.batchPrefix, nextNumber),
  };
}

async function getNextSampleNumber(date = new Date()): Promise<number> {
  const { start, end } = getYearRange(date);
  const aggregate = await prisma.sample.aggregate({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    _max: {
      number: true,
    },
  });

  return (aggregate._max.number ?? 0) + 1;
}

function formatSampleNumberString(date: Date, sampleNumber: number): string {
  const shortYear = String(date.getFullYear()).slice(-2);
  return `${shortYear}-${sampleNumber}`;
}

async function resolveStorageConditionId(
  storageConditionId?: string,
  storageConditionName?: string
): Promise<string> {
  const trimmedName = storageConditionName?.trim();

  if (storageConditionId?.trim()) {
    const existing = await prisma.storageCondition.findUnique({
      where: { id: storageConditionId.trim() },
    });
    if (!existing) {
      throw new Error('Storage condition not found');
    }
    return existing.id;
  }

  if (!trimmedName) {
    throw new Error('Choose an existing storage condition or enter a new one');
  }

  const existingByName = await prisma.storageCondition.findFirst({
    where: { name: trimmedName },
  });
  if (existingByName) {
    return existingByName.id;
  }

  const created = await prisma.storageCondition.create({
    data: { name: trimmedName },
  });
  return created.id;
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

  type Material {
    id: ID!
    name: String!
    description: String
    selfProduced: Boolean!
    caloriesKcal: Float!
    fatGrams: Float!
    proteinGrams: Float!
    carbohydratesGrams: Float!
    sugarsGrams: Float!
    fiberGrams: Float!
    saltGrams: Float!
    VAT: Float!
    Price: Float!
    purchaseUnit: String!
    purchaseUnitAmount: Float!
    consumptionUnit: String!
    ratio: Float!
    createdAt: String!
    updatedAt: String!
  }

  type Product {
    id: ID!
    name: String!
    batchPrefix: String!
    description: String
    caloriesKcal: Float!
    fatGrams: Float!
    proteinGrams: Float!
    carbohydratesGrams: Float!
    sugarsGrams: Float!
    fiberGrams: Float!
    saltGrams: Float!
    createdAt: String!
    updatedAt: String!
  }

  type StorageCondition {
    id: ID!
    name: String!
    createdAt: String!
    updatedAt: String!
  }

  type ProcessParameter {
    id: ID!
    name: String!
    value: String!
    unit: String!
  }

  type Ingredient {
    id: ID!
    product: Product
    material: Material
    amount: Float!
    unit: String!
  }

  type ProcessMap {
    id: ID!
    name: String!
    outcome: Float!
    rateOfLoss: Float!
    VAT: Float!
    containerCost: Float!
    weight: Float!
    marginalCoefficient: Float!
    productId: ID!
    parameters: [ProcessParameter!]!
    ingredients: [Ingredient!]!
    createdAt: String!
    updatedAt: String!
  }

  type Sample {
    id: ID!
    number: Int!
    numberStr: String!
    createdAt: String!
    updatedAt: String!
    studyAt: String
    result: String
    note: String
    batch: Batch!
  }

  type Batch {
    id: ID!
    product: Product!
    nettoWeight: Float!
    number: Int!
    numberStr: String!
    storageDurationHours: Int!
    storageCondition: StorageCondition!
    processMap: ProcessMap
    samples: [Sample!]!
    processDeviations: String
    createdAt: String!
    updatedAt: String!
  }

  type BatchNumberPreview {
    number: Int!
    numberStr: String!
  }

  type ImportMaterialsCsvResult {
    importedCount: Int!
    skippedCount: Int!
    errors: [String!]!
  }

  type ImportProductsCsvResult {
    importedCount: Int!
    skippedCount: Int!
    errors: [String!]!
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

  input CreateMaterialInput {
    name: String!
    description: String
    selfProduced: Boolean!
    caloriesKcal: Float!
    fatGrams: Float!
    proteinGrams: Float!
    carbohydratesGrams: Float!
    sugarsGrams: Float!
    fiberGrams: Float!
    saltGrams: Float!
    VAT: Float!
    Price: Float!
    purchaseUnit: String!
    purchaseUnitAmount: Float!
    consumptionUnit: String!
    ratio: Float!
  }

  input UpdateMaterialInput {
    name: String
    description: String
    selfProduced: Boolean
    caloriesKcal: Float
    fatGrams: Float
    proteinGrams: Float
    carbohydratesGrams: Float
    sugarsGrams: Float
    fiberGrams: Float
    saltGrams: Float
    VAT: Float
    Price: Float
    purchaseUnit: String
    purchaseUnitAmount: Float
    consumptionUnit: String
    ratio: Float
  }

  input CreateProductInput {
    name: String!
    batchPrefix: String!
    description: String
    caloriesKcal: Float!
    fatGrams: Float!
    proteinGrams: Float!
    carbohydratesGrams: Float!
    sugarsGrams: Float!
    fiberGrams: Float!
    saltGrams: Float!
  }

  input UpdateProductInput {
    name: String
    batchPrefix: String
    description: String
    caloriesKcal: Float
    fatGrams: Float
    proteinGrams: Float
    carbohydratesGrams: Float
    sugarsGrams: Float
    fiberGrams: Float
    saltGrams: Float
  }

  input CreateProcessParameterInput {
    name: String!
    value: String!
    unit: String!
  }

  input IngredientInput {
    productId: ID
    materialId: ID
    amount: Float!
  }

  input CreateProcessMapInput {
    productId: ID!
    name: String!
    outcome: Float!
    rateOfLoss: Float
    VAT: Float
    containerCost: Float
    weight: Float
    marginalCoefficient: Float
    parameters: [CreateProcessParameterInput!]
    ingredients: [IngredientInput!]
  }

  input UpdateProcessMapInput {
    name: String
    outcome: Float
    rateOfLoss: Float
    VAT: Float
    containerCost: Float
    weight: Float
    marginalCoefficient: Float
    parameters: [CreateProcessParameterInput!]
    ingredients: [IngredientInput!]
  }

  input CreateBatchInput {
    productId: ID!
    nettoWeight: Float!
    storageDurationHours: Int!
    storageConditionId: ID
    storageConditionName: String
    processDeviations: String
    processMapId: ID
    sampleCount: Int
  }

  input UpdateBatchInput {
    nettoWeight: Float
    storageDurationHours: Int
    storageConditionId: ID
    storageConditionName: String
    processDeviations: String
    processMapId: ID
  }

  input UpdateSampleInput {
    result: String
    note: String
    studyAt: String
  }

  input SearchSamplesInput {
    fromDate: String
    toDate: String
    sampleNumber: Int
  }

  type CostSettings {
    id: ID!
    marginalCoefficient: Float!
    containerCost: Float!
    productVat: Float!
    productWeight: Float!
    productContainerCosts: String!
    productMarginalCoefficients: String!
    productWeights: String!
    productVats: String!
    productMainProcessMaps: String!
    createdAt: String!
    updatedAt: String!
  }

  input UpdateCostSettingsInput {
    marginalCoefficient: Float
    containerCost: Float
    productVat: Float
    productWeight: Float
    productContainerCosts: String
    productMarginalCoefficients: String
    productWeights: String
    productVats: String
    productMainProcessMaps: String
  }

  type Query {
    hello: String
    userById(id: ID!): User!
    userInfo(id: ID, email: String): User
    sessionUser: User
    equipments: [Equipment!]!
    users: [User!]!
    cleanActions(cleaningType: CleaningType, fromDate: String, toDate: String): [CleanAction!]!
    materials: [Material!]!
    materialsCsv: String!
    products: [Product!]!
    productsCsv: String!
    storageConditions: [StorageCondition!]!
    processMaps(productId: ID!): [ProcessMap!]!
    batches: [Batch!]!
    nextBatchPreview(productId: ID!): BatchNumberPreview!
    searchSamples(input: SearchSamplesInput!): [Sample!]!
    costSettings: CostSettings!
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
    createMaterial(input: CreateMaterialInput!): Material!
    updateMaterial(id: ID!, input: UpdateMaterialInput!): Material!
    deleteMaterial(id: ID!): Boolean!
    importMaterialsCsv(csv: String!, overwriteExisting: Boolean = true): ImportMaterialsCsvResult!
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    importProductsCsv(csv: String!, overwriteExisting: Boolean = true): ImportProductsCsvResult!
    createProcessMap(input: CreateProcessMapInput!): ProcessMap!
    updateProcessMap(id: ID!, input: UpdateProcessMapInput!): ProcessMap!
    createBatch(input: CreateBatchInput!): Batch!
    updateBatch(id: ID!, input: UpdateBatchInput!): Batch!
    updateSample(id: ID!, input: UpdateSampleInput!): Sample!
    updateCostSettings(input: UpdateCostSettingsInput!): CostSettings!
  }
`;

type IngredientWithRefs = {
  productId?: string | null;
  materialId?: string | null;
  amount: number;
  product?: { consumptionUnit?: string } | null;
  material?: { consumptionUnit: string } | null;
};

const resolvers = {
  Ingredient: {
    unit: (parent: IngredientWithRefs): string => {
      if (parent.material) return parent.material.consumptionUnit;
      return 'gram';
    },
  },
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
    materials: async (_: unknown, __: unknown, { req }: GraphQLContext) => {
      if (!req.session.userId) throw new Error('Not authenticated');
      return await prisma.material.findMany({ orderBy: { name: 'asc' } });
    },
    materialsCsv: async (_: unknown, __: unknown, { req }: GraphQLContext) => {
      if (!req.session.userId) throw new Error('Not authenticated');

      const materials = await prisma.material.findMany({ orderBy: { name: 'asc' } });
      const rows = materials.map(material =>
        [
          material.name,
          material.description ?? '',
          String(material.selfProduced),
          material.caloriesKcal.toString(),
          material.fatGrams.toString(),
          material.proteinGrams.toString(),
          material.carbohydratesGrams.toString(),
          material.sugarsGrams.toString(),
          material.fiberGrams.toString(),
          material.saltGrams.toString(),
          String(material.VAT),
          String(material.Price),
          material.purchaseUnit,
          String(material.purchaseUnitAmount),
          material.consumptionUnit,
          String(material.ratio),
        ]
          .map(value => escapeCsvValue(String(value)))
          .join(';')
      );

      return [MATERIAL_CSV_HEADERS.join(';'), ...rows].join('\n');
    },
    products: async (_: unknown, __: unknown, { req }: GraphQLContext) => {
      if (!req.session.userId) throw new Error('Not authenticated');
      return await prisma.product.findMany({ orderBy: { name: 'asc' } });
    },
    productsCsv: async (_: unknown, __: unknown, { req }: GraphQLContext) => {
      if (!req.session.userId) throw new Error('Not authenticated');

      const products = await prisma.product.findMany({ orderBy: { name: 'asc' } });
      const rows = products.map(product =>
        [
          product.name,
          product.batchPrefix,
          product.description ?? '',
          product.caloriesKcal.toString(),
          product.fatGrams.toString(),
          product.proteinGrams.toString(),
          product.carbohydratesGrams.toString(),
          product.sugarsGrams.toString(),
          product.fiberGrams.toString(),
          product.saltGrams.toString(),
        ]
          .map(value => escapeCsvValue(String(value)))
          .join(',')
      );

      return [PRODUCT_CSV_HEADERS.join(','), ...rows].join('\n');
    },
    storageConditions: async (_: unknown, __: unknown, { req }: GraphQLContext) => {
      if (!req.session.userId) throw new Error('Not authenticated');
      return await prisma.storageCondition.findMany({ orderBy: { name: 'asc' } });
    },
    processMaps: async (
      _: unknown,
      { productId }: { productId: string },
      { req }: GraphQLContext
    ) => {
      if (!req.session.userId) throw new Error('Not authenticated');
      return await prisma.processMap.findMany({
        where: { productId },
        include: {
          parameters: true,
          ingredients: { include: { product: true, material: true } },
        },
        orderBy: { name: 'asc' },
      });
    },
    batches: async (_: unknown, __: unknown, { req }: GraphQLContext) => {
      if (!req.session.userId) throw new Error('Not authenticated');
      return await prisma.batch.findMany({
        include: {
          product: true,
          storageCondition: true,
          processMap: {
            include: {
              parameters: true,
              ingredients: { include: { product: true, material: true } },
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { number: 'desc' }],
      });
    },
    nextBatchPreview: async (
      _: unknown,
      { productId }: { productId: string },
      { req }: GraphQLContext
    ) => {
      if (!req.session.userId) throw new Error('Not authenticated');
      return await getNextBatchPreview(productId);
    },
    searchSamples: async (
      _: unknown,
      { input }: { input: { fromDate?: string; toDate?: string; sampleNumber?: number } },
      { req }: GraphQLContext
    ) => {
      if (!req.session.userId) throw new Error('Not authenticated');

      const where: Record<string, unknown> = {};

      if (input.sampleNumber) {
        where.number = input.sampleNumber;
      }

      if (input.fromDate || input.toDate) {
        const dateFilter: Record<string, Date> = {};
        if (input.fromDate) {
          const start = new Date(input.fromDate);
          dateFilter.gte = start;
        }
        if (input.toDate) {
          const end = new Date(input.toDate);
          end.setHours(23, 59, 59, 999);
          dateFilter.lte = end;
        }
        where.createdAt = dateFilter;
      }

      return await prisma.sample.findMany({
        where,
        include: { batch: { include: { product: true } } },
        orderBy: [{ createdAt: 'desc' }, { number: 'desc' }],
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
    costSettings: async (_: unknown, __: unknown, { req }: GraphQLContext) => {
      if (!req.session.userId) throw new Error('Not authenticated');
      
      let settings = await prisma.costSettings.findUnique({ where: { id: 'singleton' } });
      if (!settings) {
        settings = await prisma.costSettings.create({
          data: { id: 'singleton' },
        });
      }
      
      return {
        ...settings,
        createdAt: settings.createdAt.toISOString(),
        updatedAt: settings.updatedAt.toISOString(),
        productContainerCosts: JSON.stringify(settings.productContainerCosts),
        productMarginalCoefficients: JSON.stringify(settings.productMarginalCoefficients),
        productWeights: JSON.stringify(settings.productWeights),
        productVats: JSON.stringify(settings.productVats),
        productMainProcessMaps: JSON.stringify(
          (settings as Record<string, unknown>).productMainProcessMaps ?? {}
        ),
      };
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
    createMaterial: async (
      _: unknown,
      { input }: { input: CreateMaterialInput },
      { req }: GraphQLContext
    ) => {
      if (!req.session.userId) throw new Error('Not authenticated');

      return await prisma.material.create({
        data: {
          name: input.name.trim(),
          description: input.description?.trim() || null,
          selfProduced: input.selfProduced,
          caloriesKcal: input.caloriesKcal,
          fatGrams: input.fatGrams,
          proteinGrams: input.proteinGrams,
          carbohydratesGrams: input.carbohydratesGrams,
          sugarsGrams: input.sugarsGrams,
          fiberGrams: input.fiberGrams,
          saltGrams: input.saltGrams,
          VAT: input.VAT,
          Price: input.Price,
          purchaseUnit: input.purchaseUnit.trim(),
          purchaseUnitAmount: input.purchaseUnitAmount,
          consumptionUnit: input.consumptionUnit.trim(),
          ratio: input.ratio,
        },
      });
    },
    updateMaterial: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateMaterialInput },
      { req }: GraphQLContext
    ) => {
      if (!req.session.userId) throw new Error('Not authenticated');

      const data: {
        name?: string;
        description?: string | null;
        selfProduced?: boolean;
        caloriesKcal?: number;
        fatGrams?: number;
        proteinGrams?: number;
        carbohydratesGrams?: number;
        sugarsGrams?: number;
        fiberGrams?: number;
        saltGrams?: number;
        VAT?: number;
        Price?: number;
        purchaseUnit?: string;
        purchaseUnitAmount?: number;
        consumptionUnit?: string;
        ratio?: number;
      } = {};
      if (input.name !== undefined) data.name = input.name.trim();
      if (input.description !== undefined) data.description = input.description.trim() || null;
      if (input.selfProduced !== undefined) data.selfProduced = input.selfProduced;
      if (input.caloriesKcal !== undefined) data.caloriesKcal = input.caloriesKcal;
      if (input.fatGrams !== undefined) data.fatGrams = input.fatGrams;
      if (input.proteinGrams !== undefined) data.proteinGrams = input.proteinGrams;
      if (input.carbohydratesGrams !== undefined) {
        data.carbohydratesGrams = input.carbohydratesGrams;
      }
      if (input.sugarsGrams !== undefined) data.sugarsGrams = input.sugarsGrams;
      if (input.fiberGrams !== undefined) data.fiberGrams = input.fiberGrams;
      if (input.saltGrams !== undefined) data.saltGrams = input.saltGrams;
      if (input.VAT !== undefined) data.VAT = input.VAT;
      if (input.Price !== undefined) data.Price = input.Price;
      if (input.purchaseUnit !== undefined) data.purchaseUnit = input.purchaseUnit.trim();
      if (input.purchaseUnitAmount !== undefined) data.purchaseUnitAmount = input.purchaseUnitAmount;
      if (input.consumptionUnit !== undefined) data.consumptionUnit = input.consumptionUnit.trim();
      if (input.ratio !== undefined) data.ratio = input.ratio;

      if (Object.keys(data).length === 0) {
        throw new Error('No fields provided for update');
      }

      return await prisma.material.update({ where: { id }, data });
    },
    deleteMaterial: async (
      _: unknown,
      { id }: { id: string },
      { req }: GraphQLContext
    ) => {
      if (!req.session.userId) throw new Error('Not authenticated');
      await prisma.material.delete({ where: { id } });
      return true;
    },
    importMaterialsCsv: async (
      _: unknown,
      {
        csv,
        overwriteExisting,
      }: { csv: string; overwriteExisting?: boolean },
      { req }: GraphQLContext
    ): Promise<ImportMaterialsCsvResult> => {
      if (!req.session.userId) throw new Error('Not authenticated');

      const rows = buildMaterialCsvRows(parseCsv(csv));
      const result: ImportMaterialsCsvResult = {
        importedCount: 0,
        skippedCount: 0,
        errors: [],
      };

      const shouldOverwrite = overwriteExisting ?? true;
      const existingByName = new Map<string, { id: string }>();
      if (shouldOverwrite) {
        const existing = await prisma.material.findMany({
          select: { id: true, name: true },
        });
        existing.forEach(material => {
          existingByName.set(material.name.toLowerCase(), { id: material.id });
        });
      }

      for (const [index, row] of rows.entries()) {
        const csvLine = index + 2;
        const hasAnyValue = MATERIAL_CSV_HEADERS.some(header => row[header].trim().length > 0);
        if (!hasAnyValue) {
          result.skippedCount += 1;
          continue;
        }

        try {
          if (!row.name.trim()) {
            throw new Error('name is required');
          }
          if (!row.purchaseUnit.trim()) {
            throw new Error('purchaseUnit is required');
          }
          if (!row.consumptionUnit.trim()) {
            throw new Error('consumptionUnit is required');
          }

          const data = {
            name: row.name.trim(),
            description: row.description.trim() || null,
            selfProduced: parseCsvBoolean(row.selfProduced),
            caloriesKcal: parseCsvNumber(row.caloriesKcal),
            fatGrams: parseCsvNumber(row.fatGrams),
            proteinGrams: parseCsvNumber(row.proteinGrams),
            carbohydratesGrams: parseCsvNumber(row.carbohydratesGrams),
            sugarsGrams: parseCsvNumber(row.sugarsGrams),
            fiberGrams: parseCsvNumber(row.fiberGrams),
            saltGrams: parseCsvNumber(row.saltGrams),
            VAT: parseCsvNumber(row.VAT),
            Price: parseCsvNumber(row.Price),
            purchaseUnit: row.purchaseUnit.trim(),
            purchaseUnitAmount: parseCsvNumber(row.purchaseUnitAmount),
            consumptionUnit: row.consumptionUnit.trim(),
            ratio: parseCsvNumber(row.ratio),
          };

          const existingMaterial = shouldOverwrite
            ? existingByName.get(data.name.toLowerCase())
            : undefined;

          if (existingMaterial) {
            await prisma.material.update({ where: { id: existingMaterial.id }, data });
          } else {
            const created = await prisma.material.create({ data });
            if (shouldOverwrite) {
              existingByName.set(created.name.toLowerCase(), { id: created.id });
            }
          }

          result.importedCount += 1;
        } catch (error) {
          result.skippedCount += 1;
          const message = error instanceof Error ? error.message : String(error);
          result.errors.push(`Line ${csvLine}: ${message}`);
        }
      }

      return result;
    },
    createProduct: async (
      _: unknown,
      { input }: { input: CreateProductInput },
      { req }: GraphQLContext
    ) => {
      if (!req.session.userId) throw new Error('Not authenticated');

      return await prisma.product.create({
        data: {
          name: input.name.trim(),
          batchPrefix: input.batchPrefix.trim(),
          description: input.description?.trim() || null,
          caloriesKcal: input.caloriesKcal,
          fatGrams: input.fatGrams,
          proteinGrams: input.proteinGrams,
          carbohydratesGrams: input.carbohydratesGrams,
          sugarsGrams: input.sugarsGrams,
          fiberGrams: input.fiberGrams,
          saltGrams: input.saltGrams,
        },
      });
    },
    updateProduct: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateProductInput },
      { req }: GraphQLContext
    ) => {
      if (!req.session.userId) throw new Error('Not authenticated');

      const data: {
        name?: string;
        batchPrefix?: string;
        description?: string | null;
        caloriesKcal?: number;
        fatGrams?: number;
        proteinGrams?: number;
        carbohydratesGrams?: number;
        sugarsGrams?: number;
        fiberGrams?: number;
        saltGrams?: number;
      } = {};

      if (input.name !== undefined) data.name = input.name.trim();
      if (input.batchPrefix !== undefined) data.batchPrefix = input.batchPrefix.trim();
      if (input.description !== undefined) data.description = input.description.trim() || null;
      if (input.caloriesKcal !== undefined) data.caloriesKcal = input.caloriesKcal;
      if (input.fatGrams !== undefined) data.fatGrams = input.fatGrams;
      if (input.proteinGrams !== undefined) data.proteinGrams = input.proteinGrams;
      if (input.carbohydratesGrams !== undefined) {
        data.carbohydratesGrams = input.carbohydratesGrams;
      }
      if (input.sugarsGrams !== undefined) data.sugarsGrams = input.sugarsGrams;
      if (input.fiberGrams !== undefined) data.fiberGrams = input.fiberGrams;
      if (input.saltGrams !== undefined) data.saltGrams = input.saltGrams;

      if (Object.keys(data).length === 0) {
        throw new Error('No fields provided for update');
      }

      return await prisma.product.update({ where: { id }, data });
    },
    importProductsCsv: async (
      _: unknown,
      {
        csv,
        overwriteExisting,
      }: { csv: string; overwriteExisting?: boolean },
      { req }: GraphQLContext
    ): Promise<ImportProductsCsvResult> => {
      if (!req.session.userId) throw new Error('Not authenticated');

      const rows = buildProductCsvRows(parseCsv(csv));
      const result: ImportProductsCsvResult = {
        importedCount: 0,
        skippedCount: 0,
        errors: [],
      };

      const shouldOverwrite = overwriteExisting ?? true;
      const existingByBatchPrefix = new Map<string, { id: string }>();
      if (shouldOverwrite) {
        const existing = await prisma.product.findMany({
          select: { id: true, batchPrefix: true },
        });
        existing.forEach(product => {
          existingByBatchPrefix.set(product.batchPrefix.toLowerCase(), { id: product.id });
        });
      }

      for (const [index, row] of rows.entries()) {
        const csvLine = index + 2;
        const hasAnyValue = PRODUCT_CSV_HEADERS.some(header => row[header].trim().length > 0);
        if (!hasAnyValue) {
          result.skippedCount += 1;
          continue;
        }

        try {
          if (!row.name.trim()) {
            throw new Error('name is required');
          }
          if (!row.batchPrefix.trim()) {
            throw new Error('batchPrefix is required');
          }

          const data = {
            name: row.name.trim(),
            batchPrefix: row.batchPrefix.trim(),
            description: row.description.trim() || null,
            caloriesKcal: parseCsvNumber(row.caloriesKcal),
            fatGrams: parseCsvNumber(row.fatGrams),
            proteinGrams: parseCsvNumber(row.proteinGrams),
            carbohydratesGrams: parseCsvNumber(row.carbohydratesGrams),
            sugarsGrams: parseCsvNumber(row.sugarsGrams),
            fiberGrams: parseCsvNumber(row.fiberGrams),
            saltGrams: parseCsvNumber(row.saltGrams),
          };

          const existingProduct = shouldOverwrite
            ? existingByBatchPrefix.get(data.batchPrefix.toLowerCase())
            : undefined;

          if (existingProduct) {
            await prisma.product.update({ where: { id: existingProduct.id }, data });
          } else {
            const created = await prisma.product.create({ data });
            if (shouldOverwrite) {
              existingByBatchPrefix.set(created.batchPrefix.toLowerCase(), { id: created.id });
            }
          }

          result.importedCount += 1;
        } catch (error) {
          result.skippedCount += 1;
          const message = error instanceof Error ? error.message : String(error);
          result.errors.push(`Line ${csvLine}: ${message}`);
        }
      }

      return result;
    },
    createProcessMap: async (
      _: unknown,
      { input }: { input: CreateProcessMapInput },
      { req }: GraphQLContext
    ) => {
      if (!req.session.userId) throw new Error('Not authenticated');
      if (!input.name.trim()) throw new Error('Process map name is required');
      if (input.VAT !== undefined && (!Number.isFinite(input.VAT) || input.VAT < 0)) {
        throw new Error('Process map VAT must be a non-negative number');
      }
      if (
        input.rateOfLoss !== undefined &&
        (!Number.isFinite(input.rateOfLoss) || input.rateOfLoss < 0 || input.rateOfLoss >= 100)
      ) {
        throw new Error('Process map rate of loss must be between 0 and 100');
      }
      if (
        input.containerCost !== undefined &&
        (!Number.isFinite(input.containerCost) || input.containerCost < 0)
      ) {
        throw new Error('Process map container cost must be a non-negative number');
      }
      if (input.weight !== undefined && (!Number.isFinite(input.weight) || input.weight < 0)) {
        throw new Error('Process map weight must be a non-negative number');
      }
      if (
        input.marginalCoefficient !== undefined &&
        (!Number.isFinite(input.marginalCoefficient) || input.marginalCoefficient <= 0)
      ) {
        throw new Error('Process map marginal coefficient must be greater than zero');
      }

      return await prisma.processMap.create({
        data: {
          name: input.name.trim(),
          outcome: input.outcome,
          ...(input.rateOfLoss !== undefined ? { rateOfLoss: input.rateOfLoss } : {}),
          ...(input.VAT !== undefined ? { VAT: input.VAT } : {}),
          ...(input.containerCost !== undefined ? { containerCost: input.containerCost } : {}),
          ...(input.weight !== undefined ? { weight: input.weight } : {}),
          ...(input.marginalCoefficient !== undefined
            ? { marginalCoefficient: input.marginalCoefficient }
            : {}),
          product: { connect: { id: input.productId } },
          parameters: input.parameters?.length
            ? {
                create: input.parameters.map(p => ({
                  name: p.name.trim(),
                  value: p.value.trim(),
                  unit: p.unit.trim(),
                })),
              }
            : undefined,
          ingredients: input.ingredients?.length
            ? {
                create: input.ingredients.map(ing => ({
                  amount: ing.amount,
                  ...(ing.productId ? { product: { connect: { id: ing.productId } } } : {}),
                  ...(ing.materialId ? { material: { connect: { id: ing.materialId } } } : {}),
                })),
              }
            : undefined,
        },
        include: {
          parameters: true,
          ingredients: { include: { product: true, material: true } },
        },
      });
    },
    updateProcessMap: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateProcessMapInput },
      { req }: GraphQLContext
    ) => {
      if (!req.session.userId) throw new Error('Not authenticated');
      if (input.name !== undefined && !input.name.trim()) {
        throw new Error('Process map name cannot be empty');
      }
      if (input.VAT !== undefined && (!Number.isFinite(input.VAT) || input.VAT < 0)) {
        throw new Error('Process map VAT must be a non-negative number');
      }
      if (
        input.rateOfLoss !== undefined &&
        (!Number.isFinite(input.rateOfLoss) || input.rateOfLoss < 0 || input.rateOfLoss >= 100)
      ) {
        throw new Error('Process map rate of loss must be between 0 and 100');
      }
      if (
        input.containerCost !== undefined &&
        (!Number.isFinite(input.containerCost) || input.containerCost < 0)
      ) {
        throw new Error('Process map container cost must be a non-negative number');
      }
      if (input.weight !== undefined && (!Number.isFinite(input.weight) || input.weight < 0)) {
        throw new Error('Process map weight must be a non-negative number');
      }
      if (
        input.marginalCoefficient !== undefined &&
        (!Number.isFinite(input.marginalCoefficient) || input.marginalCoefficient <= 0)
      ) {
        throw new Error('Process map marginal coefficient must be greater than zero');
      }

      if (input.parameters !== undefined) {
        await prisma.processParameter.deleteMany({ where: { processMapId: id } });
      }

      if (input.ingredients !== undefined) {
        await prisma.ingredient.deleteMany({ where: { processMapId: id } });
      }

      return await prisma.processMap.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.outcome !== undefined ? { outcome: input.outcome } : {}),
          ...(input.rateOfLoss !== undefined ? { rateOfLoss: input.rateOfLoss } : {}),
          ...(input.VAT !== undefined ? { VAT: input.VAT } : {}),
          ...(input.containerCost !== undefined ? { containerCost: input.containerCost } : {}),
          ...(input.weight !== undefined ? { weight: input.weight } : {}),
          ...(input.marginalCoefficient !== undefined
            ? { marginalCoefficient: input.marginalCoefficient }
            : {}),
          ...(input.parameters !== undefined
            ? {
                parameters: {
                  create: input.parameters.map(p => ({
                    name: p.name.trim(),
                    value: p.value.trim(),
                    unit: p.unit.trim(),
                  })),
                },
              }
            : {}),
          ...(input.ingredients !== undefined
            ? {
                ingredients: {
                  create: input.ingredients.map(ing => ({
                    amount: ing.amount,
                    ...(ing.productId ? { product: { connect: { id: ing.productId } } } : {}),
                    ...(ing.materialId ? { material: { connect: { id: ing.materialId } } } : {}),
                  })),
                },
              }
            : {}),
        },
        include: {
          parameters: true,
          ingredients: { include: { product: true, material: true } },
        },
      });
    },
    createBatch: async (
      _: unknown,
      { input }: { input: CreateBatchInput },
      { req }: GraphQLContext
    ) => {
      if (!req.session.userId) throw new Error('Not authenticated');

      if (!Number.isFinite(input.nettoWeight) || input.nettoWeight <= 0) {
        throw new Error('Netto weight must be greater than 0');
      }
      if (!Number.isInteger(input.storageDurationHours) || input.storageDurationHours < 0) {
        throw new Error('Storage duration must be a non-negative integer');
      }
      if (
        input.sampleCount !== undefined &&
        (!Number.isInteger(input.sampleCount) || input.sampleCount < 0)
      ) {
        throw new Error('Sample count must be a non-negative integer');
      }

      const storageConditionId = await resolveStorageConditionId(
        input.storageConditionId,
        input.storageConditionName
      );
      const now = new Date();
      const preview = await getNextBatchPreview(input.productId, now);
      const sampleCount = input.sampleCount ?? 0;
      const sampleStartNumber = sampleCount > 0 ? await getNextSampleNumber(now) : 0;

      return await prisma.batch.create({
        data: {
          product: { connect: { id: input.productId } },
          nettoWeight: input.nettoWeight,
          number: preview.number,
          numberStr: preview.numberStr,
          storageDurationHours: input.storageDurationHours,
          storageCondition: { connect: { id: storageConditionId } },
          processDeviations: input.processDeviations?.trim() || null,
          ...(input.processMapId ? { processMap: { connect: { id: input.processMapId } } } : {}),
          ...(sampleCount > 0
            ? {
                samples: {
                  create: Array.from({ length: sampleCount }, (_, index) => {
                    const number = sampleStartNumber + index;
                    return {
                      number,
                      numberStr: formatSampleNumberString(now, number),
                      studyAt: null,
                      result: null,
                    };
                  }),
                },
              }
            : {}),
        },
        include: {
          product: true,
          storageCondition: true,
          processMap: { include: { parameters: true } },
          samples: true,
        },
      });
    },
    updateBatch: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateBatchInput },
      { req }: GraphQLContext
    ) => {
      if (!req.session.userId) throw new Error('Not authenticated');

      const data: {
        nettoWeight?: number;
        storageDurationHours?: number;
        storageConditionId?: string;
        processDeviations?: string | null;
        processMapId?: string | null;
      } = {};

      if (input.nettoWeight !== undefined) {
        if (!Number.isFinite(input.nettoWeight) || input.nettoWeight <= 0) {
          throw new Error('Netto weight must be greater than 0');
        }
        data.nettoWeight = input.nettoWeight;
      }

      if (input.storageDurationHours !== undefined) {
        if (
          !Number.isInteger(input.storageDurationHours) ||
          input.storageDurationHours < 0
        ) {
          throw new Error('Storage duration must be a non-negative integer');
        }
        data.storageDurationHours = input.storageDurationHours;
      }

      if (input.storageConditionId !== undefined || input.storageConditionName !== undefined) {
        data.storageConditionId = await resolveStorageConditionId(
          input.storageConditionId,
          input.storageConditionName
        );
      }

      if (input.processDeviations !== undefined) {
        data.processDeviations = input.processDeviations.trim() || null;
      }

      if ('processMapId' in input) {
        data.processMapId = input.processMapId ?? null;
      }

      if (Object.keys(data).length === 0) {
        throw new Error('No fields provided for update');
      }

      return await prisma.batch.update({
        where: { id },
        data,
        include: {
          product: true,
          storageCondition: true,
          processMap: { include: { parameters: true } },
        },
      });
    },
    updateSample: async (
      _: unknown,
      { id, input }: { id: string; input: { result?: string; note?: string; studyAt?: string } },
      { req }: GraphQLContext
    ) => {
      if (!req.session.userId) throw new Error('Not authenticated');

      const data: Record<string, unknown> = {};

      if (input.result !== undefined) {
        data.result = input.result.trim() || null;
      }

      if (input.note !== undefined) {
        data.note = input.note.trim() || null;
      }

      if (input.studyAt !== undefined) {
        data.studyAt = input.studyAt ? new Date(input.studyAt) : null;
      }

      if (Object.keys(data).length === 0) {
        throw new Error('No fields provided for update');
      }

      return await prisma.sample.update({
        where: { id },
        data,
        include: {
          batch: { include: { product: true } },
        },
      });
    },
    updateCostSettings: async (
      _: unknown,
      { input }: { input: Record<string, unknown> },
      { req }: GraphQLContext
    ) => {
      if (!req.session.userId) throw new Error('Not authenticated');

      const updateData: Record<string, unknown> = {};

      if (input.marginalCoefficient !== undefined) {
        updateData.marginalCoefficient = Number(input.marginalCoefficient);
      }
      if (input.containerCost !== undefined) {
        updateData.containerCost = Number(input.containerCost);
      }
      if (input.productVat !== undefined) {
        updateData.productVat = Number(input.productVat);
      }
      if (input.productWeight !== undefined) {
        updateData.productWeight = Number(input.productWeight);
      }
      if (input.productContainerCosts !== undefined) {
        updateData.productContainerCosts = JSON.parse(String(input.productContainerCosts) || '{}');
      }
      if (input.productMarginalCoefficients !== undefined) {
        updateData.productMarginalCoefficients = JSON.parse(String(input.productMarginalCoefficients) || '{}');
      }
      if (input.productWeights !== undefined) {
        updateData.productWeights = JSON.parse(String(input.productWeights) || '{}');
      }
      if (input.productVats !== undefined) {
        updateData.productVats = JSON.parse(String(input.productVats) || '{}');
      }
      if (input.productMainProcessMaps !== undefined) {
        updateData.productMainProcessMaps = JSON.parse(String(input.productMainProcessMaps) || '{}');
      }

      const settings = await prisma.costSettings.upsert({
        where: { id: 'singleton' },
        update: updateData,
        create: { id: 'singleton', ...updateData },
      });

      return {
        ...settings,
        createdAt: settings.createdAt.toISOString(),
        updatedAt: settings.updatedAt.toISOString(),
        productContainerCosts: JSON.stringify(settings.productContainerCosts),
        productMarginalCoefficients: JSON.stringify(settings.productMarginalCoefficients),
        productWeights: JSON.stringify(settings.productWeights),
        productVats: JSON.stringify(settings.productVats),
        productMainProcessMaps: JSON.stringify(
          (settings as Record<string, unknown>).productMainProcessMaps ?? {}
        ),
      };
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
  Material: {
    createdAt: (material: { createdAt: Date | string }) =>
      new Date(material.createdAt).toISOString(),
    updatedAt: (material: { updatedAt: Date | string }) =>
      new Date(material.updatedAt).toISOString(),
  },
  Product: {
    createdAt: (product: { createdAt: Date | string }) =>
      new Date(product.createdAt).toISOString(),
    updatedAt: (product: { updatedAt: Date | string }) =>
      new Date(product.updatedAt).toISOString(),
  },
  StorageCondition: {
    createdAt: (storageCondition: { createdAt: Date | string }) =>
      new Date(storageCondition.createdAt).toISOString(),
    updatedAt: (storageCondition: { updatedAt: Date | string }) =>
      new Date(storageCondition.updatedAt).toISOString(),
  },
  ProcessMap: {
    createdAt: (pm: { createdAt: Date | string }) => new Date(pm.createdAt).toISOString(),
    updatedAt: (pm: { updatedAt: Date | string }) => new Date(pm.updatedAt).toISOString(),
  },
  Batch: {
    product: (batch: { product: unknown }) => batch.product,
    storageCondition: (batch: { storageCondition: unknown }) => batch.storageCondition,
    processMap: (batch: { processMap?: unknown }) => batch.processMap ?? null,
    samples: (batch: { samples?: unknown[] }) => batch.samples ?? [],
    createdAt: (batch: { createdAt: Date | string }) =>
      new Date(batch.createdAt).toISOString(),
    updatedAt: (batch: { updatedAt: Date | string }) =>
      new Date(batch.updatedAt).toISOString(),
  },
  Sample: {
    createdAt: (sample: { createdAt: Date | string }) => new Date(sample.createdAt).toISOString(),
    updatedAt: (sample: { updatedAt: Date | string }) => new Date(sample.updatedAt).toISOString(),
    studyAt: (sample: { studyAt?: Date | string | null }) =>
      sample.studyAt ? new Date(sample.studyAt).toISOString() : null,
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
