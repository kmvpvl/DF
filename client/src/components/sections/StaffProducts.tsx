import { type ChangeEvent, createRef } from 'react';
import Proto from '../../proto';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/graphql`;

const PRODUCT_FIELDS = `
  id
  name
  batchPrefix
  description
  caloriesKcal
  fatGrams
  proteinGrams
  carbohydratesGrams
  sugarsGrams
  fiberGrams
  saltGrams
  createdAt
  updatedAt
`;

const PRODUCTS_QUERY = `
  query {
    products {
      ${PRODUCT_FIELDS}
    }
    materials {
      id
      name
      VAT
      Price
      purchaseUnitAmount
      consumptionUnit
      rateOfLoss
      ratio
    }
  }
`;

const PROCESS_MAPS_QUERY = `
  query($productId: ID!) {
    processMaps(productId: $productId) {
      id
      name
      outcome
      rateOfLoss
      VAT
      containerCost
      dose
      marginalCoefficient
      outcomeUnit
      parameters {
        id
        name
        value
        unit
      }
      ingredients {
        id
        product { id name caloriesKcal fatGrams proteinGrams carbohydratesGrams sugarsGrams fiberGrams saltGrams }
        material { id name consumptionUnit VAT Price purchaseUnitAmount ratio caloriesKcal fatGrams proteinGrams carbohydratesGrams sugarsGrams fiberGrams saltGrams }
        amount
        unit
      }
    }
  }
`;

const CREATE_PROCESS_MAP_MUTATION = `
  mutation($input: CreateProcessMapInput!) {
    createProcessMap(input: $input) {
      id
      name
      outcome
      rateOfLoss
      VAT
      containerCost
      dose
      marginalCoefficient
      outcomeUnit
      parameters {
        id
        name
        value
        unit
      }
      ingredients {
        id
        product { id name }
        material { id name consumptionUnit VAT Price purchaseUnitAmount ratio }
        amount
        unit
      }
    }
  }
`;

const UPDATE_PROCESS_MAP_MUTATION = `
  mutation($id: ID!, $input: UpdateProcessMapInput!) {
    updateProcessMap(id: $id, input: $input) {
      id
      name
      outcome
      rateOfLoss
      VAT
      containerCost
      dose
      marginalCoefficient
      outcomeUnit
      parameters {
        id
        name
        value
        unit
      }
      ingredients {
        id
        product { id name }
        material { id name consumptionUnit VAT Price purchaseUnitAmount ratio }
        amount
        unit
      }
    }
  }
`;

const PRODUCT_PROCESS_MAPS_FOR_COST_QUERY = `
  query($productId: ID!) {
    processMaps(productId: $productId) {
      id
      outcome
      outcomeUnit
      rateOfLoss
      VAT
      containerCost
      dose
      marginalCoefficient
      ingredients {
        id
        product { id name }
        material { id name consumptionUnit VAT Price purchaseUnitAmount ratio }
        amount
      }
    }
  }
`;

const DEFAULT_MARGINAL_COEFFICIENT = 2.01;
const DEFAULT_CONTAINER_COST = 35;
const DEFAULT_PRODUCT_VAT = 20;
const DEFAULT_PRODUCT_WEIGHT = 100;

const CREATE_PRODUCT_MUTATION = `
  mutation($input: CreateProductInput!) {
    createProduct(input: $input) {
      ${PRODUCT_FIELDS}
    }
  }
`;

const UPDATE_PRODUCT_MUTATION = `
  mutation($id: ID!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      ${PRODUCT_FIELDS}
    }
  }
`;

const PRODUCTS_CSV_QUERY = `
  query {
    productsCsv
  }
`;

const IMPORT_PRODUCTS_CSV_MUTATION = `
  mutation($csv: String!, $overwriteExisting: Boolean) {
    importProductsCsv(csv: $csv, overwriteExisting: $overwriteExisting) {
      importedCount
      skippedCount
      errors
    }
  }
`;

const COST_SETTINGS_QUERY = `
  query {
    costSettings {
      id
      marginalCoefficient
      containerCost
      productVat
      productWeight
      productContainerCosts
      productMarginalCoefficients
      productWeights
      productVats
      productMainProcessMaps
    }
  }
`;

const UPDATE_COST_SETTINGS_MUTATION = `
  mutation($input: UpdateCostSettingsInput!) {
    updateCostSettings(input: $input) {
      id
    }
  }
`;

interface StaffProductData {
  id: string;
  name: string;
  batchPrefix: string;
  description: string | null;
  caloriesKcal: number;
  fatGrams: number;
  proteinGrams: number;
  carbohydratesGrams: number;
  sugarsGrams: number;
  fiberGrams: number;
  saltGrams: number;
  createdAt: string;
  updatedAt: string;
}

interface MaterialOption {
  id: string;
  name: string;
  VAT: number;
  Price: number;
  purchaseUnitAmount: number;
  consumptionUnit: string;
  rateOfLoss: number;
  ratio: number;
}

interface ProcessParameterData {
  id: string;
  name: string;
  value: string;
  unit: string;
}

interface NutritionFields {
  caloriesKcal: number;
  fatGrams: number;
  proteinGrams: number;
  carbohydratesGrams: number;
  sugarsGrams: number;
  fiberGrams: number;
  saltGrams: number;
}

interface IngredientData {
  id: string;
  product: ({ id: string; name: string } & NutritionFields) | null;
  material: ({
    id: string;
    name: string;
    consumptionUnit: string;
    VAT: number;
    Price: number;
    purchaseUnitAmount: number;
    rateOfLoss: number;
    ratio: number;
  } & NutritionFields) | null;
  amount: number;
  unit: string;
}

interface ProcessMapData {
  id: string;
  name: string;
  outcome: number;
  rateOfLoss: number;
  VAT: number;
  containerCost: number;
  dose: number;
  marginalCoefficient: number;
  parameters: ProcessParameterData[];
  ingredients: IngredientData[];
  outcomeUnit: string;
}

interface ProcessMapPanelForm {
  name: string;
  outcome: string;
  rateOfLoss: string;
  marginalCoefficient: string;
  containerCost: string;
  productVat: string;
  productWeight: string;
  parameters: { name: string; value: string; unit: string }[];
  ingredients: { type: 'product' | 'material'; productId: string; materialId: string; amount: string }[];
  outcomeUnit: string;
}

interface CostCalculationLine {
  ingredientIndex: number;
  unitPriceWithoutVat: number;
  lineCost: number;
}

interface CostCalculationResult {
  lines: CostCalculationLine[];
  ingredientsTotal: number;
  costPerGramWithoutVat: number;
  weightedCostWithoutVat: number;
  totalCostWithoutVat: number;
  totalCostWithVat: number;
}

interface ProcessMapForCost {
  id: string;
  outcome: number;
  outcomeUnit: string;
  rateOfLoss: number;
  VAT: number;
  containerCost: number;
  dose: number;
  marginalCoefficient: number;
  ingredients: Array<{
    id: string;
    amount: number;
    product: { id: string; name: string } | null;
    material: {
      id: string;
      name: string;
      consumptionUnit: string;
      VAT: number;
      Price: number;
      purchaseUnitAmount: number;
      rateOfLoss: number;
      ratio: number;
    } | null;
  }>;
}

interface CostSettingsStorage {
  marginalCoefficient: number;
  containerCost: number;
  productVat: number;
  productWeight: number;
  productContainerCosts?: Record<string, number>;
  productMarginalCoefficients?: Record<string, number>;
  productWeights?: Record<string, number>;
  productVats?: Record<string, number>;
  productMainProcessMaps?: Record<string, string>;
}

interface StaffProductForm {
  name: string;
  batchPrefix: string;
  description: string;
  caloriesKcal: string;
  fatGrams: string;
  proteinGrams: string;
  carbohydratesGrams: string;
  sugarsGrams: string;
  fiberGrams: string;
  saltGrams: string;
}

interface ImportProductsCsvResult {
  importedCount: number;
  skippedCount: number;
  errors: string[];
}

interface StaffProductsState {
  products: StaffProductData[];
  materials: MaterialOption[];
  productAutoCostLoading: boolean;
  productAutoCosts: Record<string, number | null>;
  productAutoCostWeights: Record<string, number | null>;
  productAutoCostUnits: Record<string, string | null>;
  productIngredientOutcomeUnits: Record<string, string>;
  processMaps: ProcessMapData[];
  processMapLoading: boolean;
  processMapAutoCostLoading: boolean;
  processMapAutoCosts: Record<string, number | null>;
  processMapAutoCostWeights: Record<string, number | null>;
  processMapAutoCostUnits: Record<string, string | null>;
  processMapPanel: 'none' | 'create' | 'edit';
  processMapEditingId: string | null;
  processMapPanelForm: ProcessMapPanelForm;
  processMapSaving: boolean;
  processMapCostCalculating: boolean;
  processMapCostResult: CostCalculationResult | null;
  loading: boolean;
  saving: boolean;
  csvProcessing: boolean;
  error: string | null;
  csvResult: string | null;
  adding: boolean;
  editingProduct: StaffProductData | null;
  form: StaffProductForm;
}

const INITIAL_FORM: StaffProductForm = {
  name: '',
  batchPrefix: '',
  description: '',
  caloriesKcal: '0',
  fatGrams: '0',
  proteinGrams: '0',
  carbohydratesGrams: '0',
  sugarsGrams: '0',
  fiberGrams: '0',
  saltGrams: '0',
};

const INITIAL_PROCESS_MAP_PANEL_FORM: ProcessMapPanelForm = {
  name: '',
  outcome: '',
  rateOfLoss: '0',
  marginalCoefficient: String(DEFAULT_MARGINAL_COEFFICIENT),
  containerCost: String(DEFAULT_CONTAINER_COST),
  productVat: String(DEFAULT_PRODUCT_VAT),
  productWeight: String(DEFAULT_PRODUCT_WEIGHT),
  parameters: [],
  ingredients: [],
  outcomeUnit: 'g',
};

interface StaffProductsProps {
  userId?: string;
}

class StaffProducts extends Proto<StaffProductsProps, StaffProductsState> {
  private readonly fileInputRef = createRef<HTMLInputElement>();
  private readonly productUnitPriceCache = new Map<string, number>();
  private readonly processMapsForCostCache = new Map<string, ProcessMapForCost[]>();
  private productContainerCostById: Record<string, number> = {};
  private productMarginalCoefficientById: Record<string, number> = {};
  private productWeightById: Record<string, number> = {};
  private productVatById: Record<string, number> = {};
  private productMainProcessMapById: Record<string, string> = {};
  state: StaffProductsState = {
    products: [],
    materials: [],
    productAutoCostLoading: false,
    productAutoCosts: {},
    productAutoCostWeights: {},
    productAutoCostUnits: {},
    productIngredientOutcomeUnits: {},
    processMaps: [],
    processMapLoading: false,
    processMapAutoCostLoading: false,
    processMapAutoCosts: {},
    processMapAutoCostWeights: {},
    processMapAutoCostUnits: {},
    processMapPanel: 'none',
    processMapEditingId: null,
    processMapPanelForm: { ...INITIAL_PROCESS_MAP_PANEL_FORM },
    processMapSaving: false,
    processMapCostCalculating: false,
    processMapCostResult: null,
    loading: false,
    saving: false,
    csvProcessing: false,
    error: null,
    csvResult: null,
    adding: false,
    editingProduct: null,
    form: { ...INITIAL_FORM },
  };

  componentDidMount() {
    void this.hydrateCostSettings();
    void this.fetchProducts();
  }

  private hydrateCostSettings = async () => {
    try {
      const data = await this.gql(COST_SETTINGS_QUERY);
      const settings = data.costSettings as {
        marginalCoefficient: number;
        containerCost: number;
        productVat: number;
        productWeight: number;
        productContainerCosts: string;
        productMarginalCoefficients: string;
        productWeights: string;
        productVats: string;
        productMainProcessMaps: string;
      };

      const productContainerCosts = JSON.parse(settings.productContainerCosts || '{}') as Record<string, number>;
      const productMarginalCoefficients = JSON.parse(settings.productMarginalCoefficients || '{}') as Record<string, number>;
      const productWeights = JSON.parse(settings.productWeights || '{}') as Record<string, number>;
      const productVats = JSON.parse(settings.productVats || '{}') as Record<string, number>;
      const productMainProcessMaps = JSON.parse(settings.productMainProcessMaps || '{}') as Record<string, string>;

      this.productContainerCostById = Object.fromEntries(
        Object.entries(productContainerCosts)
          .map(([productId, value]) => [productId, Number(value)] as const)
          .filter((entry) => Number.isFinite(entry[1]) && entry[1] >= 0)
      );
      this.productMarginalCoefficientById = Object.fromEntries(
        Object.entries(productMarginalCoefficients)
          .map(([productId, value]) => [productId, Number(value)] as const)
          .filter((entry) => Number.isFinite(entry[1]) && entry[1] > 0)
      );
      this.productWeightById = Object.fromEntries(
        Object.entries(productWeights)
          .map(([productId, value]) => [productId, Number(value)] as const)
          .filter((entry) => Number.isFinite(entry[1]) && entry[1] >= 0)
      );
      this.productVatById = Object.fromEntries(
        Object.entries(productVats)
          .map(([productId, value]) => [productId, Number(value)] as const)
          .filter((entry) => Number.isFinite(entry[1]) && entry[1] >= 0)
      );
      this.productMainProcessMapById = Object.fromEntries(
        Object.entries(productMainProcessMaps)
          .map(([productId, processMapId]) => [productId, String(processMapId)] as const)
          .filter((entry) => entry[1].trim().length > 0)
      );

      this.setState((prev) => ({
        processMapPanelForm: {
          ...prev.processMapPanelForm,
          marginalCoefficient: String(settings.marginalCoefficient),
          containerCost: String(settings.containerCost),
          productVat: String(settings.productVat),
          productWeight: String(settings.productWeight),
        },
      }));
    } catch {
      // If database load fails, use defaults
    }
  };

  private getContainerCostForProduct = (
    productId: string | null | undefined,
    fallbackContainerCost: number
  ): number => {
    if (!productId) {
      return fallbackContainerCost;
    }

    const specific = this.productContainerCostById[productId];
    return Number.isFinite(specific) && specific >= 0 ? specific : fallbackContainerCost;
  };

  private getMarginalCoefficientForProduct = (
    productId: string | null | undefined,
    fallbackMarginalCoefficient: number
  ): number => {
    if (!productId) {
      return fallbackMarginalCoefficient;
    }

    const specific = this.productMarginalCoefficientById[productId];
    return Number.isFinite(specific) && specific > 0
      ? specific
      : fallbackMarginalCoefficient;
  };

  private getProductWeightForProduct = (
    productId: string | null | undefined,
    fallbackProductWeight: number
  ): number => {
    if (!productId) {
      return fallbackProductWeight;
    }

    const specific = this.productWeightById[productId];
    return Number.isFinite(specific) && specific >= 0 ? specific : fallbackProductWeight;
  };

  private getProductVatForProduct = (
    productId: string | null | undefined,
    fallbackProductVat: number
  ): number => {
    if (!productId) {
      return fallbackProductVat;
    }

    const specific = this.productVatById[productId];
    return Number.isFinite(specific) && specific >= 0 ? specific : fallbackProductVat;
  };

  private getMaterialUnitPriceWithoutVat = (material: MaterialOption): number => {
    const vatFactor = 1 + material.VAT / 100;
    const priceWithoutVat = vatFactor > 0 ? material.Price / vatFactor : material.Price;
    let result = priceWithoutVat;
    if (material.ratio > 0) {
      result /= material.ratio;
    }
    if (material.purchaseUnitAmount > 0) {
      result /= material.purchaseUnitAmount;
    }
    if (material.rateOfLoss > 0) {
      result /= (1 - material.rateOfLoss/100);
    }
    return result;
  };

  private loadProcessMapsForCost = async (productId: string): Promise<ProcessMapForCost[]> => {
    const cached = this.processMapsForCostCache.get(productId);
    if (cached) {
      return cached;
    }

    const data = await this.gql(PRODUCT_PROCESS_MAPS_FOR_COST_QUERY, { productId });
    const maps = (data.processMaps as ProcessMapForCost[]) ?? [];
    this.processMapsForCostCache.set(productId, maps);
    return maps;
  };

  private getMainProcessMapForProduct = (
    productId: string,
    processMaps: ProcessMapForCost[]
  ): ProcessMapForCost | null => {
    if (processMaps.length === 0) {
      return null;
    }

    const configuredMainId = this.productMainProcessMapById[productId];
    if (configuredMainId) {
      const configuredMain = processMaps.find((pm) => pm.id === configuredMainId);
      if (configuredMain) {
        return configuredMain;
      }
    }

    return processMaps[0] ?? null;
  };

  private setMainProcessMapForProduct = async (productId: string, processMapId: string) => {
    this.productMainProcessMapById = {
      ...this.productMainProcessMapById,
      [productId]: processMapId,
    };
const maps = this.processMapsForCostCache.get(productId);
    const selectedMain = maps?.find((pm) => pm.id === processMapId);
    if (selectedMain?.outcomeUnit?.trim()) {
      this.setState((prev) => ({
        productIngredientOutcomeUnits: {
          ...prev.productIngredientOutcomeUnits,
          [productId]: selectedMain.outcomeUnit.trim(),
        },
      }));
    }

    
    // Force immediate UI refresh for "main" badge/button state.
    this.setState({ error: null });
    this.triggerProductTableAutoCostCalculation();

    try {
      await this.gql(UPDATE_COST_SETTINGS_MUTATION, {
        input: {
          productMainProcessMaps: JSON.stringify(this.productMainProcessMapById),
        },
      });
    } catch (error) {
      this.setState({
        error: `Main process map was set locally, but could not be saved: ${String(error)}`,
      });
    }
  };

  private computeProductUnitPriceWithoutVat = async (
    productId: string,
    marginalCoefficient: number,
    visiting: Set<string>,
    applyMarginalCoefficient: boolean
  ): Promise<number> => {
    const cacheKey = `${productId}:${applyMarginalCoefficient ? 'with-marginal' : 'without-marginal'}`;
    const cached = this.productUnitPriceCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    if (visiting.has(productId)) {
      throw new Error('Circular product dependency in process maps.');
    }
    visiting.add(productId);

    try {
      const maps = await this.loadProcessMapsForCost(productId);
      if (maps.length === 0) {
        throw new Error('Referenced product has no process map for cost calculation.');
      }

      const selectedMap = this.getMainProcessMapForProduct(productId, maps);
      if (!selectedMap) {
        throw new Error('Referenced product has no process map for cost calculation.');
      }
      const outcome = Number(selectedMap.outcome);
      if (!Number.isFinite(outcome) || outcome <= 0) {
        throw new Error('Referenced product process map outcome must be greater than zero.');
      }

      const mapRateOfLoss = Number(selectedMap.rateOfLoss);
      const effectiveRateOfLoss =
        Number.isFinite(mapRateOfLoss) && mapRateOfLoss >= 0 && mapRateOfLoss < 100
          ? mapRateOfLoss
          : 0;

      const mapMarginalCoefficient = Number(selectedMap.marginalCoefficient);
      const effectiveMarginalCoefficient =
        Number.isFinite(mapMarginalCoefficient) && mapMarginalCoefficient > 0
          ? mapMarginalCoefficient
          : marginalCoefficient;

      let ingredientsTotal = 0;
      for (const ingredient of selectedMap.ingredients) {
        const amount = Number(ingredient.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
          continue;
        }

        if (ingredient.material) {
          ingredientsTotal += this.getMaterialUnitPriceWithoutVat(ingredient.material) * amount;
          continue;
        }

        if (ingredient.product?.id) {
          const unitPrice = await this.computeProductUnitPriceWithoutVat(
            ingredient.product.id,
            marginalCoefficient,
            visiting,
            applyMarginalCoefficient
          );
          ingredientsTotal += unitPrice * amount;
        }
      }

      const totalCostWithoutVat = applyMarginalCoefficient
        ? ingredientsTotal * effectiveMarginalCoefficient
        : ingredientsTotal;
      const effectiveOutcome = outcome * (1 - effectiveRateOfLoss / 100);
      if (!Number.isFinite(effectiveOutcome) || effectiveOutcome <= 0) {
        throw new Error('Referenced product process map effective outcome must be greater than zero.');
      }
      const unitPriceWithoutVat = totalCostWithoutVat / effectiveOutcome;
      this.productUnitPriceCache.set(cacheKey, unitPriceWithoutVat);
      return unitPriceWithoutVat;
    } finally {
      visiting.delete(productId);
    }
  };

  private calculateProcessMapCost = async (
    options: { silent?: boolean } = {}
  ) => {
    const { processMapPanelForm } = this.state;
    const silent = options.silent ?? false;
    const getValidationState = (
      message: string
    ): Pick<StaffProductsState, 'processMapCostResult' | 'error'> => ({
      processMapCostResult: null,
      error: silent ? null : message,
    });
    const outcome = Number.parseFloat(processMapPanelForm.outcome);
    if (!Number.isFinite(outcome) || outcome <= 0) {
      this.setState(getValidationState('Outcome must be greater than zero to calculate cost.'));
      return;
    }

    const rateOfLoss = Number.parseFloat(processMapPanelForm.rateOfLoss);
    if (!Number.isFinite(rateOfLoss) || rateOfLoss < 0 || rateOfLoss >= 100) {
      this.setState(getValidationState('Rate of loss must be between 0 and 100.'));
      return;
    }

    const marginalCoefficient = Number.parseFloat(processMapPanelForm.marginalCoefficient);
    if (!Number.isFinite(marginalCoefficient) || marginalCoefficient <= 0) {
      this.setState(getValidationState('Marginal coefficient must be greater than zero.'));
      return;
    }

    const containerCost = Number.parseFloat(processMapPanelForm.containerCost);
    if (!Number.isFinite(containerCost) || containerCost < 0) {
      this.setState(getValidationState('Cost of container must be a non-negative number.'));
      return;
    }

    const productVat = Number.parseFloat(processMapPanelForm.productVat);
    if (!Number.isFinite(productVat) || productVat < 0) {
      this.setState(getValidationState('VAT of product must be a non-negative number.'));
      return;
    }

    const productWeight = Number.parseFloat(processMapPanelForm.productWeight);
    if (!Number.isFinite(productWeight) || productWeight < 0) {
      this.setState(getValidationState('Dose must be a non-negative number.'));
      return;
    }

    this.setState({ processMapCostCalculating: true, processMapCostResult: null, error: null });
    this.productUnitPriceCache.clear();
    this.processMapsForCostCache.clear();

    try {
      const lines: CostCalculationLine[] = [];
      for (let idx = 0; idx < processMapPanelForm.ingredients.length; idx += 1) {
        const ingredient = processMapPanelForm.ingredients[idx];
        const amount = Number.parseFloat(ingredient.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
          continue;
        }

        let unitPriceWithoutVat = 0;
        if (ingredient.type === 'material') {
          const material = this.state.materials.find((item) => item.id === ingredient.materialId);
          if (!material) {
            continue;
          }
          unitPriceWithoutVat = this.getMaterialUnitPriceWithoutVat(material);
        } else if (ingredient.productId) {
          unitPriceWithoutVat = await this.computeProductUnitPriceWithoutVat(
            ingredient.productId,
            marginalCoefficient,
            new Set<string>(),
            false
          );
        }

        lines.push({
          ingredientIndex: idx,
          unitPriceWithoutVat,
          lineCost: unitPriceWithoutVat * amount,
        });
      }

      const ingredientsTotal = lines.reduce((sum, line) => sum + line.lineCost, 0);
      const effectiveOutcome = outcome * (1 - rateOfLoss / 100);
      if (!Number.isFinite(effectiveOutcome) || effectiveOutcome <= 0) {
        throw new Error('Effective outcome must be greater than zero.');
      }
      const costPerGramWithoutVat = (ingredientsTotal * marginalCoefficient) / effectiveOutcome;
      const weightedCostWithoutVat = costPerGramWithoutVat * productWeight;
      const totalCostWithoutVat = weightedCostWithoutVat + containerCost;
      const totalCostWithVat = weightedCostWithoutVat * (1 + productVat / 100) + containerCost;

      this.setState({
        processMapCostCalculating: false,
        processMapCostResult: {
          lines,
          ingredientsTotal,
          costPerGramWithoutVat,
          weightedCostWithoutVat,
          totalCostWithoutVat,
          totalCostWithVat,
        },
      });
    } catch (error) {
      const failureState: Pick<
        StaffProductsState,
        'processMapCostCalculating' | 'processMapCostResult' | 'error'
      > = {
        processMapCostCalculating: false,
        processMapCostResult: null,
        error: silent ? null : String(error),
      };
      this.setState(failureState);
    }
  };

  private triggerAutoProcessMapCostCalculation = () => {
    void this.calculateProcessMapCost({ silent: true });
  };

  private getParsedCostSettings = (): CostSettingsStorage | null => {
    const { processMapPanelForm } = this.state;
    const marginalCoefficient = Number.parseFloat(processMapPanelForm.marginalCoefficient);
    const containerCost = Number.parseFloat(processMapPanelForm.containerCost);
    const productVat = Number.parseFloat(processMapPanelForm.productVat);
    const productWeight = Number.parseFloat(processMapPanelForm.productWeight);

    if (
      !Number.isFinite(marginalCoefficient) ||
      marginalCoefficient <= 0 ||
      !Number.isFinite(containerCost) ||
      containerCost < 0 ||
      !Number.isFinite(productVat) ||
      productVat < 0 ||
      !Number.isFinite(productWeight) ||
      productWeight < 0
    ) {
      return null;
    }

    return {
      marginalCoefficient,
      containerCost,
      productVat,
      productWeight,
    };
  };

  private calculateSingleProcessMapTotalWithVat = async (
    processMap: ProcessMapData,
    defaults: CostSettingsStorage
  ): Promise<number | null> => {
    const outcome = Number(processMap.outcome);
    if (!Number.isFinite(outcome) || outcome <= 0) {
      return null;
    }

    const mapRateOfLoss = Number(processMap.rateOfLoss);
    const rateOfLoss =
      Number.isFinite(mapRateOfLoss) && mapRateOfLoss >= 0 && mapRateOfLoss < 100
        ? mapRateOfLoss
        : 0;

    const mapMarginalCoefficient = Number(processMap.marginalCoefficient);
    const mapDose = Number(processMap.dose);
    const mapVat = Number(processMap.VAT);
    const mapContainerCost = Number(processMap.containerCost);

    const marginalCoefficient =
      Number.isFinite(mapMarginalCoefficient) && mapMarginalCoefficient > 0
        ? mapMarginalCoefficient
        : defaults.marginalCoefficient;
    const productWeight =
      Number.isFinite(mapDose) && mapDose >= 0 ? mapDose : defaults.productWeight;
    const productVat = Number.isFinite(mapVat) && mapVat >= 0 ? mapVat : defaults.productVat;
    const containerCost =
      Number.isFinite(mapContainerCost) && mapContainerCost >= 0
        ? mapContainerCost
        : defaults.containerCost;

    let ingredientsTotal = 0;
    for (const ingredient of processMap.ingredients) {
      const amount = Number(ingredient.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        continue;
      }

      if (ingredient.material) {
        ingredientsTotal += this.getMaterialUnitPriceWithoutVat(ingredient.material) * amount;
        continue;
      }

      if (ingredient.product?.id) {
        const unitPriceWithoutVat = await this.computeProductUnitPriceWithoutVat(
          ingredient.product.id,
          defaults.marginalCoefficient,
          new Set<string>(),
          false
        );
        ingredientsTotal += unitPriceWithoutVat * amount;
      }
    }

    const effectiveOutcome = outcome * (1 - rateOfLoss / 100);
    if (!Number.isFinite(effectiveOutcome) || effectiveOutcome <= 0) {
      return null;
    }

    const costPerGramWithoutVat =
      (ingredientsTotal * marginalCoefficient) / effectiveOutcome;
    const weightedCostWithoutVat = costPerGramWithoutVat * productWeight;
    const totalCostWithVat =
      weightedCostWithoutVat * (1 + productVat / 100) + containerCost;

    return totalCostWithVat;
  };

  private calculateProcessMapListAutoCosts = async (
    processMaps: ProcessMapData[]
  ) => {
    if (processMaps.length === 0) {
      this.setState({
        processMapAutoCosts: {},
        processMapAutoCostWeights: {},
        processMapAutoCostUnits: {},
        processMapAutoCostLoading: false,
      });
      return;
    }

    const settings = this.getParsedCostSettings();
    if (!settings) {
      this.setState({
        processMapAutoCosts: {},
        processMapAutoCostWeights: {},
        processMapAutoCostUnits: {},
        processMapAutoCostLoading: false,
      });
      return;
    }

    this.productUnitPriceCache.clear();
    this.processMapsForCostCache.clear();

    try {
      const pairs = await Promise.all(
        processMaps.map(async (pm) => {
          const total = await this.calculateSingleProcessMapTotalWithVat(pm, settings);
          if (total === null) {
            return [pm.id, null, null, null] as const;
          }

          const mapDose = Number(pm.dose);
          const resolvedWeight =
            Number.isFinite(mapDose) && mapDose >= 0 ? mapDose : settings.productWeight;
          const resolvedUnit = pm.outcomeUnit.trim() || null;
          return [pm.id, total, resolvedWeight, resolvedUnit] as const;
        })
      );

      this.setState({
        processMapAutoCosts: Object.fromEntries(
          pairs.map(([processMapId, total]) => [processMapId, total])
        ),
        processMapAutoCostWeights: Object.fromEntries(
          pairs.map(([processMapId, , weight]) => [processMapId, weight])
        ) as Record<string, number | null>,
        processMapAutoCostUnits: Object.fromEntries(
          pairs.map(([processMapId, , , unit]) => [processMapId, unit])
        ) as Record<string, string | null>,
        processMapAutoCostLoading: false,
      });
    } catch {
      this.setState({
        processMapAutoCostLoading: false,
        processMapAutoCosts: {},
        processMapAutoCostWeights: {},
        processMapAutoCostUnits: {},
      });
    }
  };

  private calculateProductTableAutoCosts = async (
    products: StaffProductData[]
  ) => {
    if (products.length === 0) {
      this.setState({
        productAutoCostLoading: false,
        productAutoCosts: {},
        productAutoCostWeights: {},
        productAutoCostUnits: {},
      });
      return;
    }

    const settings = this.getParsedCostSettings();
    if (!settings) {
      this.setState({
        productAutoCostLoading: false,
        productAutoCosts: {},
        productAutoCostWeights: {},
        productAutoCostUnits: {},
      });
      return;
    }

    this.setState({ productAutoCostLoading: true });
    this.productUnitPriceCache.clear();
    this.processMapsForCostCache.clear();

    try {
      const pairs = await Promise.all(
        products.map(async (product) => {
          const maps = await this.loadProcessMapsForCost(product.id);
          const selectedMap = this.getMainProcessMapForProduct(product.id, maps);
          if (!selectedMap) {
            return [product.id, null, null, null] as const;
          }

          const productMarginalCoefficient =
            Number.isFinite(Number(selectedMap.marginalCoefficient)) &&
            Number(selectedMap.marginalCoefficient) > 0
              ? Number(selectedMap.marginalCoefficient)
              : settings.marginalCoefficient;
          const productContainerCost =
            Number.isFinite(Number(selectedMap.containerCost)) &&
            Number(selectedMap.containerCost) >= 0
              ? Number(selectedMap.containerCost)
              : settings.containerCost;
          const productVat =
            Number.isFinite(Number(selectedMap.VAT)) && Number(selectedMap.VAT) >= 0
              ? Number(selectedMap.VAT)
              : settings.productVat;
          const productWeight =
            Number.isFinite(Number(selectedMap.dose)) && Number(selectedMap.dose) >= 0
              ? Number(selectedMap.dose)
              : settings.productWeight;

          const outcome = Number(selectedMap.outcome);
          if (!Number.isFinite(outcome) || outcome <= 0) {
            return [product.id, null, null, null] as const;
          }

          const productRateOfLoss =
            Number.isFinite(Number(selectedMap.rateOfLoss)) &&
            Number(selectedMap.rateOfLoss) >= 0 &&
            Number(selectedMap.rateOfLoss) < 100
              ? Number(selectedMap.rateOfLoss)
              : 0;

          let ingredientsTotal = 0;
          for (const ingredient of selectedMap.ingredients) {
            const amount = Number(ingredient.amount);
            if (!Number.isFinite(amount) || amount <= 0) {
              continue;
            }

            if (ingredient.material) {
              ingredientsTotal += this.getMaterialUnitPriceWithoutVat(ingredient.material) * amount;
              continue;
            }

            if (ingredient.product?.id) {
              const unitPriceWithoutVat = await this.computeProductUnitPriceWithoutVat(
                ingredient.product.id,
                productMarginalCoefficient,
                new Set<string>(),
                false
              );
              ingredientsTotal += unitPriceWithoutVat * amount;
            }
          }

          const effectiveOutcome = outcome * (1 - productRateOfLoss / 100);
          if (!Number.isFinite(effectiveOutcome) || effectiveOutcome <= 0) {
            return [product.id, null, null, null] as const;
          }

          const costPerGramWithoutVat =
            (ingredientsTotal * productMarginalCoefficient) / effectiveOutcome;
          const weightedCostWithoutVat = costPerGramWithoutVat * productWeight;
          const totalCostWithVat =
            weightedCostWithoutVat * (1 + productVat / 100) + productContainerCost;

          const resolvedUnit = selectedMap.outcomeUnit.trim() || null;
          return [product.id, totalCostWithVat, productWeight, resolvedUnit] as const;
        })
      );

      this.setState({
        productAutoCostLoading: false,
        productAutoCosts: Object.fromEntries(
          pairs.map(([productId, total]) => [productId, total])
        ),
        productAutoCostWeights: Object.fromEntries(
          pairs.map(([productId, , productWeight]) => [productId, productWeight ?? null])
        ) as Record<string, number | null>,
        productAutoCostUnits: Object.fromEntries(
          pairs.map(([productId, , , unit]) => [productId, unit])
        ) as Record<string, string | null>,
      });
    } catch {
      this.setState({
        productAutoCostLoading: false,
        productAutoCostUnits: {},
      });
    }
  };

  private triggerProductTableAutoCostCalculation = () => {
    void this.calculateProductTableAutoCosts(this.state.products);
  };

  private formatAutoCostWeight = (weight: number | null): string => {
    if (weight === null || !Number.isFinite(weight)) {
      return '0';
    }

    return Number.isInteger(weight)
      ? this.toInteger(weight)
      : this.toFixed(weight);
  };

  private gql = async (query: string, variables: Record<string, unknown> = {}) => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ query, variables }),
    });

    const json = (await response.json()) as {
      data?: Record<string, unknown>;
      errors?: { message: string }[];
    };

    if (json.errors?.length) {
      throw new Error(json.errors[0].message);
    }

    return json.data as Record<string, unknown>;
  };

  private fetchProducts = async () => {
    this.setState({ loading: true, error: null });

    try {
      const data = await this.gql(PRODUCTS_QUERY);
      const products = data.products as StaffProductData[];
      this.setState({
        loading: false,
        products,
        materials: data.materials as MaterialOption[],
      }, () => {
        this.triggerProductTableAutoCostCalculation();
      });
    } catch (error) {
      this.setState({ loading: false, error: String(error) });
    }
  };

  private loadProcessMaps = async (productId: string) => {
    this.setState({ processMapLoading: true, processMapAutoCostLoading: true, error: null });
    try {
      const data = await this.gql(PROCESS_MAPS_QUERY, { productId });
      const processMaps = data.processMaps as ProcessMapData[];
      this.setState({
        processMaps,
        processMapLoading: false,
      });
      void this.calculateProcessMapListAutoCosts(processMaps);
    } catch (error) {
      this.setState({
        processMapLoading: false,
        processMapAutoCostLoading: false,
        error: String(error),
      });
    }
  };

  private exportProductsCsv = async () => {
    this.setState({ csvProcessing: true, error: null, csvResult: null });

    try {
      const data = await this.gql(PRODUCTS_CSV_QUERY);
      const csv = String(data.productsCsv ?? '');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `staff-products-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      this.setState({
        csvProcessing: false,
        csvResult: 'Products exported to CSV.',
      });
    } catch (error) {
      this.setState({ csvProcessing: false, error: String(error) });
    }
  };

  private openImportPicker = () => {
    this.fileInputRef.current?.click();
  };

  private importProductsCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    this.setState({ csvProcessing: true, error: null, csvResult: null });

    try {
      const csv = await file.text();
      const data = await this.gql(IMPORT_PRODUCTS_CSV_MUTATION, {
        csv,
        overwriteExisting: true,
      });

      const result = data.importProductsCsv as ImportProductsCsvResult;
      await this.fetchProducts();

      const summary = `Imported ${result.importedCount}, skipped ${result.skippedCount}.`;
      const details = result.errors.length > 0 ? ` Errors: ${result.errors.join(' | ')}` : '';

      this.setState({
        csvProcessing: false,
        csvResult: `${summary}${details}`,
      });
    } catch (error) {
      this.setState({ csvProcessing: false, error: String(error) });
    }
  };

  private openCreateForm = () => {
    const { processMapPanelForm } = this.state;
    this.setState({
      adding: true,
      editingProduct: null,
      form: { ...INITIAL_FORM },
      processMaps: [],
      processMapAutoCosts: {},
      processMapAutoCostWeights: {},
      processMapAutoCostUnits: {},
      productIngredientOutcomeUnits: {},
      processMapAutoCostLoading: false,
      processMapPanel: 'none',
      processMapEditingId: null,
      processMapPanelForm: {
        ...INITIAL_PROCESS_MAP_PANEL_FORM,
        marginalCoefficient: processMapPanelForm.marginalCoefficient,
        containerCost: processMapPanelForm.containerCost,
        productVat: processMapPanelForm.productVat,
        productWeight: processMapPanelForm.productWeight,
      },
      processMapCostResult: null,
      error: null,
    });
  };

  private openEditForm = (product: StaffProductData) => {
    window.scrollTo({
      top: 0, 
      behavior: 'smooth'
    });
    const { processMapPanelForm } = this.state;
    const fallbackMarginalCoefficient = Number.parseFloat(processMapPanelForm.marginalCoefficient);
    const resolvedMarginalFallback =
      Number.isFinite(fallbackMarginalCoefficient) && fallbackMarginalCoefficient > 0
        ? fallbackMarginalCoefficient
        : DEFAULT_MARGINAL_COEFFICIENT;
    const fallbackContainerCost = Number.parseFloat(processMapPanelForm.containerCost);
    const resolvedFallback =
      Number.isFinite(fallbackContainerCost) && fallbackContainerCost >= 0
        ? fallbackContainerCost
        : DEFAULT_CONTAINER_COST;
    const fallbackProductWeight = Number.parseFloat(processMapPanelForm.productWeight);
    const resolvedWeightFallback =
      Number.isFinite(fallbackProductWeight) && fallbackProductWeight >= 0
        ? fallbackProductWeight
        : DEFAULT_PRODUCT_WEIGHT;
    const fallbackProductVat = Number.parseFloat(processMapPanelForm.productVat);
    const resolvedVatFallback =
      Number.isFinite(fallbackProductVat) && fallbackProductVat >= 0
        ? fallbackProductVat
        : DEFAULT_PRODUCT_VAT;
    const productMarginalCoefficient = this.getMarginalCoefficientForProduct(
      product.id,
      resolvedMarginalFallback
    );
    const productContainerCost = this.getContainerCostForProduct(product.id, resolvedFallback);
    const productWeight = this.getProductWeightForProduct(product.id, resolvedWeightFallback);
    const productVat = this.getProductVatForProduct(product.id, resolvedVatFallback);
    this.setState({
      adding: false,
      editingProduct: product,
      error: null,
      form: {
        name: product.name,
        batchPrefix: product.batchPrefix,
        description: product.description ?? '',
        caloriesKcal: String(product.caloriesKcal),
        fatGrams: String(product.fatGrams),
        proteinGrams: String(product.proteinGrams),
        carbohydratesGrams: String(product.carbohydratesGrams),
        sugarsGrams: String(product.sugarsGrams),
        fiberGrams: String(product.fiberGrams),
        saltGrams: String(product.saltGrams),
      },
      processMapPanel: 'none',
      processMapEditingId: null,
      productIngredientOutcomeUnits: {},
      processMapPanelForm: {
        ...INITIAL_PROCESS_MAP_PANEL_FORM,
        marginalCoefficient: String(productMarginalCoefficient),
        containerCost: String(productContainerCost),
        productVat: String(productVat),
        productWeight: String(productWeight),
      },
    });
    void this.loadProcessMaps(product.id);
  };

  private closeForm = () => {
    const { processMapPanelForm } = this.state;
    this.setState({
      adding: false,
      editingProduct: null,
      form: { ...INITIAL_FORM },
      processMaps: [],
      processMapPanel: 'none',
      processMapEditingId: null,
      processMapPanelForm: {
        ...INITIAL_PROCESS_MAP_PANEL_FORM,
        marginalCoefficient: processMapPanelForm.marginalCoefficient,
        containerCost: processMapPanelForm.containerCost,
        productVat: processMapPanelForm.productVat,
        productWeight: processMapPanelForm.productWeight,
      },
      processMapCostResult: null,
      processMapAutoCosts: {},
      processMapAutoCostWeights: {},
      processMapAutoCostUnits: {},
      productIngredientOutcomeUnits: {},
      processMapAutoCostLoading: false,
    });
  };

  private openCreateProcessMap = () => {
    this.setState({
      processMapPanel: 'create',
      processMapEditingId: null,
      processMapPanelForm: {
        ...INITIAL_PROCESS_MAP_PANEL_FORM,
        marginalCoefficient: this.state.processMapPanelForm.marginalCoefficient,
        containerCost: this.state.processMapPanelForm.containerCost,
        productVat: this.state.processMapPanelForm.productVat,
        productWeight: this.state.processMapPanelForm.productWeight,
      },
      processMapCostResult: null,
    });
  };

  private openEditProcessMap = (processMapId: string) => {
    const { processMaps } = this.state;
    const pm = processMaps.find(p => p.id === processMapId);
    if (!pm) return;
    this.setState({
      processMapPanel: 'edit',
      processMapEditingId: processMapId,
      processMapPanelForm: {
        name: pm.name,
        outcome: String(pm.outcome),
        rateOfLoss: String(pm.rateOfLoss),
        marginalCoefficient: String(pm.marginalCoefficient),
        containerCost: String(pm.containerCost),
        productVat: String(pm.VAT),
        productWeight: String(pm.dose),
        parameters: pm.parameters.map(p => ({ name: p.name, value: p.value, unit: p.unit })),
        ingredients: pm.ingredients.map(ing => ({
          type: ing.product ? 'product' : 'material',
          productId: ing.product?.id ?? '',
          materialId: ing.material?.id ?? '',
          amount: String(ing.amount),
        })),
        outcomeUnit: pm.outcomeUnit,
      },
      processMapCostResult: null,
    }, () => {
      this.triggerAutoProcessMapCostCalculation();
    });

    // Pre-load outcomeUnit for any existing product ingredients
    const productIngredientIds = pm.ingredients
      .filter(ing => ing.product?.id)
      .map(ing => ing.product!.id);
    for (const productId of productIngredientIds) {
      void this.loadProcessMapsForCost(productId).then((maps) => {
        const main = this.getMainProcessMapForProduct(productId, maps);
        const outcomeUnit = main?.outcomeUnit?.trim() ?? '';
        if (outcomeUnit) {
          this.setState(prev => ({
            productIngredientOutcomeUnits: { ...prev.productIngredientOutcomeUnits, [productId]: outcomeUnit },
          }));
        }
      });
    }
  };

  private closeProcessMapPanel = () => {
    this.setState({
      processMapPanel: 'none',
      processMapEditingId: null,
      processMapPanelForm: {
        ...INITIAL_PROCESS_MAP_PANEL_FORM,
        marginalCoefficient: this.state.processMapPanelForm.marginalCoefficient,
        containerCost: this.state.processMapPanelForm.containerCost,
        productVat: this.state.processMapPanelForm.productVat,
        productWeight: this.state.processMapPanelForm.productWeight,
      },
      processMapCostResult: null,
    });
  };

  private saveProcessMap = async () => {
    const { editingProduct, processMapPanel, processMapPanelForm, processMapEditingId } = this.state;
    if (!editingProduct) return;
    if (!processMapPanelForm.name.trim()) {
      this.setState({ error: 'Process map name is required.' });
      return;
    }
    const outcome = Number.parseFloat(processMapPanelForm.outcome);
    if (!Number.isFinite(outcome)) {
      this.setState({ error: 'Outcome must be a valid number.' });
      return;
    }

    const rateOfLoss = Number.parseFloat(processMapPanelForm.rateOfLoss);
    if (!Number.isFinite(rateOfLoss) || rateOfLoss < 0 || rateOfLoss >= 100) {
      this.setState({ error: 'Rate of loss must be between 0 and 100.' });
      return;
    }

    const marginalCoefficient = Number.parseFloat(processMapPanelForm.marginalCoefficient);
    if (!Number.isFinite(marginalCoefficient) || marginalCoefficient <= 0) {
      this.setState({ error: 'Marginal coefficient must be greater than zero.' });
      return;
    }

    const containerCost = Number.parseFloat(processMapPanelForm.containerCost);
    if (!Number.isFinite(containerCost) || containerCost < 0) {
      this.setState({ error: 'Cost of container must be a non-negative number.' });
      return;
    }

    const productVat = Number.parseFloat(processMapPanelForm.productVat);
    if (!Number.isFinite(productVat) || productVat < 0) {
      this.setState({ error: 'VAT of product must be a non-negative number.' });
      return;
    }

    const productWeight = Number.parseFloat(processMapPanelForm.productWeight);
    if (!Number.isFinite(productWeight) || productWeight < 0) {
      this.setState({ error: 'Dose must be a non-negative number.' });
      return;
    }

    this.setState({ processMapSaving: true, error: null });
    try {
      if (processMapPanel === 'create') {
        await this.gql(CREATE_PROCESS_MAP_MUTATION, {
          input: {
            productId: editingProduct.id,
            name: processMapPanelForm.name.trim(),
            outcome,
            rateOfLoss,
            VAT: productVat,
            containerCost,
            dose: productWeight,
            marginalCoefficient,
            outcomeUnit: processMapPanelForm.outcomeUnit,
            parameters: processMapPanelForm.parameters.map(p => ({
              name: p.name.trim(),
              value: p.value.trim(),
              unit: p.unit.trim(),
            })),
            ingredients: processMapPanelForm.ingredients
              .filter(ing => ing.amount.trim() && (ing.productId || ing.materialId))
              .map(ing => ({
                productId: ing.type === 'product' ? ing.productId || undefined : undefined,
                materialId: ing.type === 'material' ? ing.materialId || undefined : undefined,
                amount: Number.parseFloat(ing.amount),
              })),
          },
        });
      } else if (processMapEditingId) {
        await this.gql(UPDATE_PROCESS_MAP_MUTATION, {
          id: processMapEditingId,
          input: {
            name: processMapPanelForm.name.trim(),
            outcome,
            rateOfLoss,
            VAT: productVat,
            containerCost,
            dose: productWeight,
            marginalCoefficient,
            outcomeUnit: processMapPanelForm.outcomeUnit,
            parameters: processMapPanelForm.parameters.map(p => ({
              name: p.name.trim(),
              value: p.value.trim(),
              unit: p.unit.trim(),
            })),
            ingredients: processMapPanelForm.ingredients
              .filter(ing => ing.amount.trim() && (ing.productId || ing.materialId))
              .map(ing => ({
                productId: ing.type === 'product' ? ing.productId || undefined : undefined,
                materialId: ing.type === 'material' ? ing.materialId || undefined : undefined,
                amount: Number.parseFloat(ing.amount),
              })),
          },
        });
      }

      await this.loadProcessMaps(editingProduct.id);
      this.setState({
        processMapSaving: false,
        processMapPanel: 'none',
        processMapEditingId: null,
        processMapPanelForm: {
          ...INITIAL_PROCESS_MAP_PANEL_FORM,
          marginalCoefficient: processMapPanelForm.marginalCoefficient,
          containerCost: processMapPanelForm.containerCost,
          productVat: processMapPanelForm.productVat,
          productWeight: processMapPanelForm.productWeight,
        },
        processMapCostResult: null,
      });
    } catch (error) {
      this.setState({ processMapSaving: false, error: String(error) });
    }
  };

  private addParameter = () => {
    this.setState((prev) => ({
      processMapPanelForm: {
        ...prev.processMapPanelForm,
        parameters: [...prev.processMapPanelForm.parameters, { name: '', value: '', unit: '' }],
      },
      processMapCostResult: null,
    }));
  };

  private removeParameter = (idx: number) => {
    this.setState((prev) => ({
      processMapPanelForm: {
        ...prev.processMapPanelForm,
        parameters: prev.processMapPanelForm.parameters.filter((_, i) => i !== idx),
      },
      processMapCostResult: null,
    }));
  };

  private updateParameter = (idx: number, field: 'name' | 'value' | 'unit', val: string) => {
    this.setState((prev) => {
      const parameters = prev.processMapPanelForm.parameters.map((p, i) =>
        i === idx ? { ...p, [field]: val } : p
      );
      return {
        processMapPanelForm: { ...prev.processMapPanelForm, parameters },
        processMapCostResult: null,
      };
    }, () => {
      this.triggerAutoProcessMapCostCalculation();
    });
  };

  private addIngredient = () => {
    this.setState((prev) => ({
      processMapPanelForm: {
        ...prev.processMapPanelForm,
        ingredients: [
          ...prev.processMapPanelForm.ingredients,
          { type: 'material', productId: '', materialId: '', amount: '' },
        ],
      },
      processMapCostResult: null,
    }), () => {
      this.triggerAutoProcessMapCostCalculation();
    });
  };

  private removeIngredient = (idx: number) => {
    this.setState((prev) => ({
      processMapPanelForm: {
        ...prev.processMapPanelForm,
        ingredients: prev.processMapPanelForm.ingredients.filter((_, i) => i !== idx),
      },
      processMapCostResult: null,
    }), () => {
      this.triggerAutoProcessMapCostCalculation();
    });
  };

  private updateIngredient = (
    idx: number,
    field: 'type' | 'productId' | 'materialId' | 'amount',
    val: string
  ) => {
    this.setState((prev) => {
      const ingredients = prev.processMapPanelForm.ingredients.map((ing, i) => {
      if (field === 'productId' && val) {
        void this.loadProcessMapsForCost(val)
          .then((maps) => {
            const main = this.getMainProcessMapForProduct(val, maps);
            const outcomeUnit = main?.outcomeUnit?.trim() ?? '';
            if (!outcomeUnit) {
              return;
            }
            this.setState((prev) => ({
              productIngredientOutcomeUnits: {
                ...prev.productIngredientOutcomeUnits,
                [val]: outcomeUnit,
              },
            }));
          })
          .catch(() => {
            // Ignore unit preload errors for ingredient picker.
          });
      }
        if (i !== idx) return ing;
        if (field === 'type') {
          return { ...ing, type: val as 'product' | 'material', productId: '', materialId: '' };
        }
        return { ...ing, [field]: val };
      });
      return {
        processMapPanelForm: { ...prev.processMapPanelForm, ingredients },
        processMapCostResult: null,
      };
    }, () => {
      this.triggerAutoProcessMapCostCalculation();
    });
  };

  private calculateNutritionsFromComposition = () => {
    const { editingProduct, processMaps, form } = this.state;
    if (!editingProduct) return;

    if (!window.confirm('Do you agree to lose current nutrition values? They will be recalculated from the composition.')) {
      return;
    }

    const mainProcessMapId = this.productMainProcessMapById[editingProduct.id];
    const mainProcessMap = mainProcessMapId
      ? processMaps.find((pm) => pm.id === mainProcessMapId)
      : processMaps[0];

    if (!mainProcessMap) {
      this.setState({ error: 'No process map found to calculate nutrition from.' });
      return;
    }

    const outcome = Number(mainProcessMap.outcome);
    if (!Number.isFinite(outcome) || outcome <= 0) {
      this.setState({ error: 'Process map outcome must be greater than zero to calculate nutrition.' });
      return;
    }

    let caloriesKcal = 0;
    let fatGrams = 0;
    let proteinGrams = 0;
    let carbohydratesGrams = 0;
    let sugarsGrams = 0;
    let fiberGrams = 0;
    let saltGrams = 0;

    for (const ingredient of mainProcessMap.ingredients) {
      const amount = Number(ingredient.amount);
      if (!Number.isFinite(amount) || amount <= 0) continue;
      const nutrition = ingredient.material ?? ingredient.product;
      if (!nutrition) continue;
      const factor = amount / 100;
      caloriesKcal += factor * Number(nutrition.caloriesKcal);
      fatGrams += factor * Number(nutrition.fatGrams);
      proteinGrams += factor * Number(nutrition.proteinGrams);
      carbohydratesGrams += factor * Number(nutrition.carbohydratesGrams);
      sugarsGrams += factor * Number(nutrition.sugarsGrams);
      fiberGrams += factor * Number(nutrition.fiberGrams);
      saltGrams += factor * Number(nutrition.saltGrams);
    }

    const per100 = 100 / outcome;
    this.setState({
      form: {
        ...form,
        caloriesKcal: (caloriesKcal * per100).toFixed(3),
        fatGrams: (fatGrams * per100).toFixed(3),
        proteinGrams: (proteinGrams * per100).toFixed(3),
        carbohydratesGrams: (carbohydratesGrams * per100).toFixed(3),
        sugarsGrams: (sugarsGrams * per100).toFixed(3),
        fiberGrams: (fiberGrams * per100).toFixed(3),
        saltGrams: (saltGrams * per100).toFixed(3),
      },
    });
  };

  private saveProduct = async () => {
    const { form, editingProduct } = this.state;

    const caloriesKcal = Number.parseFloat(form.caloriesKcal);
    const fatGrams = Number.parseFloat(form.fatGrams);
    const proteinGrams = Number.parseFloat(form.proteinGrams);
    const carbohydratesGrams = Number.parseFloat(form.carbohydratesGrams);
    const sugarsGrams = Number.parseFloat(form.sugarsGrams);
    const fiberGrams = Number.parseFloat(form.fiberGrams);
    const saltGrams = Number.parseFloat(form.saltGrams);

    if (
      !form.name.trim() ||
      !form.batchPrefix.trim() ||
      !Number.isFinite(caloriesKcal) ||
      !Number.isFinite(fatGrams) ||
      !Number.isFinite(proteinGrams) ||
      !Number.isFinite(carbohydratesGrams) ||
      !Number.isFinite(sugarsGrams) ||
      !Number.isFinite(fiberGrams) ||
      !Number.isFinite(saltGrams)
    ) {
      this.setState({
        error: 'Please fill all required fields with valid values.',
      });
      return;
    }

    this.setState({ saving: true, error: null });

    const input = {
      name: form.name.trim(),
      batchPrefix: form.batchPrefix.trim(),
      description: form.description.trim() || null,
      caloriesKcal,
      fatGrams,
      proteinGrams,
      carbohydratesGrams,
      sugarsGrams,
      fiberGrams,
      saltGrams,
    };

    try {
      if (editingProduct) {
        const data = await this.gql(UPDATE_PRODUCT_MUTATION, {
          id: editingProduct.id,
          input,
        });
        const updated = data.updateProduct as StaffProductData;

        this.setState((prevState) => ({
          saving: false,
          editingProduct: null,
          adding: false,
          form: { ...INITIAL_FORM },
          products: prevState.products
            .map((product) => (product.id === updated.id ? updated : product))
            .sort((a, b) => a.name.localeCompare(b.name)),
        }), () => {
          this.triggerProductTableAutoCostCalculation();
        });
      } else {
        const data = await this.gql(CREATE_PRODUCT_MUTATION, { input });
        const created = data.createProduct as StaffProductData;

        this.setState((prevState) => ({
          saving: false,
          adding: false,
          form: { ...INITIAL_FORM },
          products: [...prevState.products, created].sort((a, b) =>
            a.name.localeCompare(b.name)
          ),
        }), () => {
          this.triggerProductTableAutoCostCalculation();
        });
      }
    } catch (error) {
      this.setState({ saving: false, error: String(error) });
    }
  };

  render() {
    const {
      products,
      materials,
      productAutoCostLoading,
      productAutoCosts,
      productAutoCostWeights,
      productAutoCostUnits,
      processMaps,
      processMapLoading,
      processMapAutoCostLoading,
      processMapAutoCosts,
      processMapAutoCostWeights,
      processMapAutoCostUnits,
      processMapPanel,
      processMapPanelForm,
      processMapSaving,
      processMapCostCalculating,
      processMapCostResult,
      loading,
      saving,
      csvProcessing,
      error,
      csvResult,
      adding,
      editingProduct,
      form,
    } = this.state;
    const outcomeUnitLabel = processMapPanelForm.outcomeUnit.trim() || 'unit';

    return (
      <div className="cleaning-journal">
        <div className="cj-header">
          <p className="section-label">Products</p>
          <h1 className="section-title cj-title">Products</h1>
        </div>

        <div className="cj-panel">
          <div className="cj-panel-header">
            <h2 className="cj-panel-title">Staff product list</h2>
            <div className="material-panel-actions">
              <button
                className="btn-outline cj-add-btn"
                onClick={() => void this.exportProductsCsv()}
                disabled={csvProcessing}
              >
                {csvProcessing ? 'Processing...' : 'Export CSV'}
              </button>
              <button
                className="btn-outline cj-add-btn"
                onClick={this.openImportPicker}
                disabled={csvProcessing}
              >
                {csvProcessing ? 'Processing...' : 'Import CSV'}
              </button>
              {!adding && !editingProduct && (
                <button className="btn-primary cj-add-btn" onClick={this.openCreateForm}>
                  + Add product
                </button>
              )}
            </div>
            <input
              ref={this.fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="material-file-input"
              onChange={(event) => {
                void this.importProductsCsv(event);
              }}
            />
          </div>

          {error && <div className="cj-error">{error}</div>}
          {csvResult && <div className="cj-success">{csvResult}</div>}

          {(adding || editingProduct) && (
            <form
              className="material-form"
              onSubmit={(event) => {
                event.preventDefault();
                void this.saveProduct();
              }}
            >
              <label className="cj-label">
                Name
                <input
                  className="cj-input material-input"
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    this.setState({ form: { ...form, name: event.target.value } })
                  }
                  required
                />
              </label>

              <label className="cj-label">
                Batch prefix
                <input
                  className="cj-input material-input"
                  type="text"
                  value={form.batchPrefix}
                  onChange={(event) =>
                    this.setState({ form: { ...form, batchPrefix: event.target.value } })
                  }
                  required
                />
              </label>

              <label className="cj-label">
                Description
                <textarea
                  className="cj-input material-textarea"
                  value={form.description}
                  onChange={(event) =>
                    this.setState({ form: { ...form, description: event.target.value } })
                  }
                />
              </label>

              {editingProduct && (
                <div style={{ marginBottom: '8px' }}>
                  <button
                    type="button"
                    className="btn-outline"
                    disabled={processMaps.length === 0 || processMapLoading}
                    onClick={this.calculateNutritionsFromComposition}
                  >
                    Calculate nutritions by composition
                  </button>
                </div>
              )}

              <div className="material-grid">
                <label className="cj-label">
                  Calories (kcal)
                  <input
                    className="cj-input material-input"
                    type="number"
                    step="1"
                    value={form.caloriesKcal}
                    onChange={(event) =>
                      this.setState({ form: { ...form, caloriesKcal: event.target.value } })
                    }
                    required
                  />
                </label>

                <label className="cj-label">
                  Fat (g)
                  <input
                    className="cj-input material-input"
                    type="number"
                    step="1"
                    value={form.fatGrams}
                    onChange={(event) =>
                      this.setState({ form: { ...form, fatGrams: event.target.value } })
                    }
                    required
                  />
                </label>

                <label className="cj-label">
                  Protein (g)
                  <input
                    className="cj-input material-input"
                    type="number"
                    step="1"
                    value={form.proteinGrams}
                    onChange={(event) =>
                      this.setState({ form: { ...form, proteinGrams: event.target.value } })
                    }
                    required
                  />
                </label>

                <label className="cj-label">
                  Carbohydrates (g)
                  <input
                    className="cj-input material-input"
                    type="number"
                    step="1"
                    value={form.carbohydratesGrams}
                    onChange={(event) =>
                      this.setState({ form: { ...form, carbohydratesGrams: event.target.value } })
                    }
                    required
                  />
                </label>

                <label className="cj-label">
                  Sugars (g)
                  <input
                    className="cj-input material-input"
                    type="number"
                    step="1"
                    value={form.sugarsGrams}
                    onChange={(event) =>
                      this.setState({ form: { ...form, sugarsGrams: event.target.value } })
                    }
                    required
                  />
                </label>

                <label className="cj-label">
                  Fiber (g)
                  <input
                    className="cj-input material-input"
                    type="number"
                    step="1"
                    value={form.fiberGrams}
                    onChange={(event) =>
                      this.setState({ form: { ...form, fiberGrams: event.target.value } })
                    }
                    required
                  />
                </label>

                <label className="cj-label">
                  Salt (g)
                  <input
                    className="cj-input material-input"
                    type="number"
                    step="1"
                    value={form.saltGrams}
                    onChange={(event) =>
                      this.setState({ form: { ...form, saltGrams: event.target.value } })
                    }
                    required
                  />
                </label>
              </div>

              {editingProduct && (
                <div className="cj-label">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Process maps</span>
                    <button type="button" className="cj-btn-sm" onClick={this.openCreateProcessMap}>
                      + New process map
                    </button>
                  </div>

                  <div style={{ marginTop: '8px', display: 'grid', gap: '6px' }}>
                    {processMapLoading ? (
                      <span className="cj-loading">Loading process maps...</span>
                    ) : processMaps.length === 0 ? (
                      <span className="cj-empty">No process maps for this product.</span>
                    ) : (
                      processMaps.map(pm => {
                        const isMainProcessMap =
                          (editingProduct
                            ? this.productMainProcessMapById[editingProduct.id]
                            : undefined) === pm.id ||
                          (!editingProduct || !this.productMainProcessMapById[editingProduct.id]
                            ? processMaps[0]?.id === pm.id
                            : false);

                        return (
                        <div
                          key={pm.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            padding: '8px 10px',
                          }}
                        >
                          <span>
                            <strong>{pm.name}</strong> (outcome: {pm.outcome})
                            {processMapAutoCostLoading ? (
                              <span style={{ marginLeft: '8px', color: '#666', fontSize: '0.85em' }}>
                                auto cost: calculating...
                              </span>
                            ) : processMapAutoCosts[pm.id] != null ? (
                              <span style={{ marginLeft: '8px', color: '#345d2f', fontSize: '0.85em' }}>
                                auto cost: {this.toFixed(processMapAutoCosts[pm.id]??0)} /{this.formatAutoCostWeight(processMapAutoCostWeights[pm.id] ?? null)} {(processMapAutoCostUnits[pm.id] ?? pm.outcomeUnit) || 'unit'}
                              </span>
                            ) : (
                              <span style={{ marginLeft: '8px', color: '#888', fontSize: '0.85em' }}>
                                auto cost: -
                              </span>
                            )}
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="cj-btn-sm"
                              disabled={isMainProcessMap || !editingProduct}
                              onClick={() => {
                                if (!editingProduct) {
                                  return;
                                }
                                void this.setMainProcessMapForProduct(editingProduct.id, pm.id);
                              }}
                            >
                              {isMainProcessMap ? 'Main for auto cost' : 'Set as main'}
                            </button>
                            <button type="button" className="cj-btn-sm" onClick={() => this.openEditProcessMap(pm.id)}>
                              Edit
                            </button>
                          </div>
                        </div>
                        );
                      })
                    )}
                  </div>

                  {processMapPanel !== 'none' && (
                    <div
                      className="material-form"
                      style={{ marginTop: '12px', padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }}
                    >
                      <h4 style={{ margin: '0 0 8px' }}>
                        {processMapPanel === 'create' ? 'New process map' : 'Edit process map'}
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', alignItems: 'end' }}>
                        <label className="cj-label" style={{ margin: 0 }}>
                          Name
                          <input
                            className="cj-input batch-input-wide"
                            type="text"
                            value={processMapPanelForm.name}
                            onChange={(event) =>
                              this.setState({
                                processMapPanelForm: {
                                  ...processMapPanelForm,
                                  name: event.target.value,
                                },
                              })
                            }
                            placeholder="Process map name"
                          />
                        </label>

                        <label className="cj-label" style={{ margin: 0 }}>
                          Outcome
                          <input
                            className="cj-input batch-input-wide"
                            type="number"
                            step="1"
                            value={processMapPanelForm.outcome}
                            onChange={(event) =>
                              this.setState({
                                processMapPanelForm: {
                                  ...processMapPanelForm,
                                  outcome: event.target.value,
                                },
                                processMapCostResult: null,
                              }, () => {
                                this.triggerAutoProcessMapCostCalculation();
                              })
                            }
                            placeholder="Outcome"
                          />
                          {processMapCostResult && (
                            <div style={{ marginTop: '4px', fontSize: '0.8em', color: '#345d2f' }}>
                              Auto total (with VAT): <strong>{this.toCurrency(processMapCostResult.totalCostWithVat)}</strong>
                            </div>
                          )}
                        </label>

                        <label className="cj-label" style={{ margin: 0 }}>
                          Outcome unit
                          <input
                            className="cj-input batch-input-wide"
                            type="text"
                            value={processMapPanelForm.outcomeUnit}
                            onChange={(event) =>
                              this.setState({
                                processMapPanelForm: {
                                  ...processMapPanelForm,
                                  outcomeUnit: event.target.value,
                                },
                              })
                            }
                            placeholder="e.g. g, pcs, ml"
                          />
                        </label>

                        <label className="cj-label" style={{ margin: 0 }}>
                          Rate of loss (%)
                          <input
                            className="cj-input batch-input-wide"
                            type="number"
                            step="1"
                            min="0"
                            max="99.99"
                            value={processMapPanelForm.rateOfLoss}
                            onChange={(event) =>
                              this.setState({
                                processMapPanelForm: {
                                  ...processMapPanelForm,
                                  rateOfLoss: event.target.value,
                                },
                                processMapCostResult: null,
                              }, () => {
                                this.triggerAutoProcessMapCostCalculation();
                                this.triggerProductTableAutoCostCalculation();
                              })
                            }
                            placeholder="Rate of loss %"
                          />
                        </label>

                        <label className="cj-label" style={{ margin: 0 }}>
                          Marginal coeff
                          <input
                            className="cj-input batch-input-wide"
                            type="number"
                            step="1"
                            value={processMapPanelForm.marginalCoefficient}
                            onChange={(event) =>
                              this.setState({
                                processMapPanelForm: {
                                  ...processMapPanelForm,
                                  marginalCoefficient: event.target.value,
                                },
                                processMapCostResult: null,
                              }, () => {
                                this.triggerAutoProcessMapCostCalculation();
                                this.triggerProductTableAutoCostCalculation();
                              })
                            }
                            placeholder="Marginal coeff"
                          />
                        </label>

                        <label className="cj-label" style={{ margin: 0 }}>
                          Container cost
                          <input
                            className="cj-input batch-input-wide"
                            type="number"
                            step="1"
                            value={processMapPanelForm.containerCost}
                            onChange={(event) =>
                              this.setState({
                                processMapPanelForm: {
                                  ...processMapPanelForm,
                                  containerCost: event.target.value,
                                },
                                processMapCostResult: null,
                              }, () => {
                                this.triggerAutoProcessMapCostCalculation();
                                this.triggerProductTableAutoCostCalculation();
                              })
                            }
                            placeholder="Container cost"
                          />
                        </label>

                        <label className="cj-label" style={{ margin: 0 }}>
                          VAT (%)
                          <input
                            className="cj-input batch-input-wide"
                            type="number"
                            step="1"
                            value={processMapPanelForm.productVat}
                            onChange={(event) =>
                              this.setState({
                                processMapPanelForm: {
                                  ...processMapPanelForm,
                                  productVat: event.target.value,
                                },
                                processMapCostResult: null,
                              }, () => {
                                this.triggerAutoProcessMapCostCalculation();
                                this.triggerProductTableAutoCostCalculation();
                              })
                            }
                            placeholder="VAT %"
                          />
                        </label>

                        <label className="cj-label" style={{ margin: 0 }}>
                          Dose ({outcomeUnitLabel})
                          <input
                            className="cj-input batch-input-wide"
                            type="number"
                            step="1"
                            min="0"
                            value={processMapPanelForm.productWeight}
                            onChange={(event) =>
                              this.setState({
                                processMapPanelForm: {
                                  ...processMapPanelForm,
                                  productWeight: event.target.value,
                                },
                                processMapCostResult: null,
                              }, () => {
                                this.triggerAutoProcessMapCostCalculation();
                                this.triggerProductTableAutoCostCalculation();
                              })
                            }
                            placeholder={`Dose ${outcomeUnitLabel}`}
                          />
                        </label>
                      </div>

                      <div style={{ marginTop: '8px', display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn-outline"
                          style={{ flexShrink: 0 }}
                          disabled={processMapCostCalculating}
                          onClick={() => {
                            void this.calculateProcessMapCost();
                          }}
                        >
                          {processMapCostCalculating ? 'Calculating...' : 'Calculate cost'}
                        </button>
                        {processMapCostResult && (
                          <div
                            style={{
                              padding: '6px 10px',
                              border: '1px solid #ddd',
                              borderRadius: '6px',
                              background: '#fafafa',
                              fontSize: '0.85em',
                              lineHeight: '1.6',
                            }}
                          >
                            <div>Ingredients total (w/o VAT): {this.toCurrency(processMapCostResult.ingredientsTotal)}</div>
                            <div>Cost / {outcomeUnitLabel} (w/o VAT): {this.toCurrency(processMapCostResult.costPerGramWithoutVat)}</div>
                            <div>Cost for dose (w/o VAT): {this.toCurrency(processMapCostResult.weightedCostWithoutVat)}</div>
                            <div>Total (w/o VAT): {this.toCurrency(processMapCostResult.totalCostWithoutVat)}</div>
                            <div>Total (with VAT): <strong>{this.toCurrency(processMapCostResult.totalCostWithVat)}</strong></div>
                          </div>
                        )}
                      </div>

                      <div style={{ marginTop: '8px' }}>
                        <strong style={{ fontSize: '0.9em' }}>Parameters</strong>
                        {processMapPanelForm.parameters.map((param, idx) => (
                          <div
                            key={idx}
                            style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '6px' }}
                          >
                            <input
                              className="cj-input material-input"
                              placeholder="Name"
                              value={param.name}
                              onChange={(e) => this.updateParameter(idx, 'name', e.target.value)}
                            />
                            <input
                              className="cj-input material-input"
                              placeholder="Value"
                              value={param.value}
                              onChange={(e) => this.updateParameter(idx, 'value', e.target.value)}
                            />
                            <input
                              className="cj-input material-input"
                              placeholder="Unit"
                              value={param.unit}
                              style={{ maxWidth: '80px' }}
                              onChange={(e) => this.updateParameter(idx, 'unit', e.target.value)}
                            />
                            <button type="button" className="cj-btn-sm" onClick={() => this.removeParameter(idx)}>
                              x
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn-outline"
                          style={{ marginTop: '8px', fontSize: '0.85em' }}
                          onClick={this.addParameter}
                        >
                          + Add parameter
                        </button>
                      </div>

                      <div style={{ marginTop: '12px' }}>
                        <strong style={{ fontSize: '0.9em' }}>Ingredients</strong>
                        {processMapPanelForm.ingredients.map((ing, idx) => {
                          const costLine = processMapCostResult?.lines.find(
                            (line) => line.ingredientIndex === idx
                          );
                          const unit =
                            ing.type === 'material'
                              ? (materials.find(m => m.id === ing.materialId)?.consumptionUnit ?? '')
                              : (ing.productId
                                  ? (this.state.productIngredientOutcomeUnits[ing.productId] ?? '')
                                  : '');
                          return (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                gap: '6px',
                                alignItems: 'center',
                                marginTop: '6px',
                                flexWrap: 'wrap',
                              }}
                            >
                              <select
                                className="cj-select"
                                style={{ width: '90px' }}
                                value={ing.type}
                                onChange={(e) => this.updateIngredient(idx, 'type', e.target.value)}
                              >
                                <option value="material">Material</option>
                                <option value="product">Product</option>
                              </select>

                              {ing.type === 'material' ? (
                                <select
                                  className="cj-select"
                                  style={{ flex: 1, minWidth: '140px' }}
                                  value={ing.materialId}
                                  onChange={(e) => this.updateIngredient(idx, 'materialId', e.target.value)}
                                >
                                  <option value="">Select material</option>
                                  {materials.map(m => (
                                    <option key={m.id} value={m.id}>
                                      {m.name} ({m.consumptionUnit})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <select
                                  className="cj-select"
                                  style={{ flex: 1, minWidth: '140px' }}
                                  value={ing.productId}
                                  onChange={(e) => this.updateIngredient(idx, 'productId', e.target.value)}
                                >
                                  <option value="">Select product</option>
                                  {products.map(p => (
                                    <option key={p.id} value={p.id}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              )}

                              <input
                                className="cj-input material-input"
                                type="number"
                                step="1"
                                min="0"
                                placeholder="Amount"
                                style={{ width: '90px' }}
                                value={ing.amount}
                                onChange={(e) => this.updateIngredient(idx, 'amount', e.target.value)}
                              />
                              {unit && (
                                <span style={{ fontSize: '0.85em', color: '#666', minWidth: '40px' }}>{unit}</span>
                              )}
                              {costLine && (
                                <span style={{ fontSize: '0.8em', color: '#666', minWidth: '210px' }}>
                                  unit: {this.toCurrency(costLine.unitPriceWithoutVat)} | line: {this.toCurrency(costLine.lineCost)}
                                </span>
                              )}
                              <button type="button" className="cj-btn-sm" onClick={() => this.removeIngredient(idx)}>
                                x
                              </button>
                            </div>
                          );
                        })}

                        <button
                          type="button"
                          className="btn-outline"
                          style={{ marginTop: '8px', fontSize: '0.85em' }}
                          onClick={this.addIngredient}
                        >
                          + Add ingredient
                        </button>
                      </div>

                      <div className="material-actions" style={{ marginTop: '12px' }}>
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={processMapSaving}
                          onClick={() => void this.saveProcessMap()}
                        >
                          {processMapSaving ? 'Saving...' : 'Save process map'}
                        </button>
                        <button type="button" className="btn-outline" onClick={this.closeProcessMapPanel}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="material-actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingProduct ? 'Update product' : 'Create product'}
                </button>
                <button type="button" className="btn-outline" onClick={this.closeForm}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <p className="cj-loading">Loading...</p>
          ) : (
            <table className="cj-table material-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Batch prefix</th>
                  <th>kcal</th>
                  <th>Fat</th>
                  <th>Protein</th>
                  <th>Carbs</th>
                  <th>Auto cost</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="cj-empty">
                      No product records yet.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                        <div className="material-description">{product.description || 'No description'}</div>
                      </td>
                      <td>{product.batchPrefix}</td>
                      <td>{product.caloriesKcal}</td>
                      <td>{product.fatGrams}</td>
                      <td>{product.proteinGrams}</td>
                      <td>{product.carbohydratesGrams}</td>
                      <td>
                        {productAutoCostLoading
                          ? 'Calculating...'
                          : productAutoCosts[product.id] != null
                            ? `${this.toCurrency(productAutoCosts[product.id]!)} /${this.formatAutoCostWeight(productAutoCostWeights[product.id] ?? null)} ${productAutoCostUnits[product.id] ?? 'unit'}`
                            : '-'}
                      </td>
                      <td className="cj-row-actions">
                        <button className="cj-btn-sm" onClick={() => this.openEditForm(product)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }
}

export default StaffProducts;