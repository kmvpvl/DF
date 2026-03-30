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

const CREATE_PROCESS_MAP_MUTATION = `
  mutation($input: CreateProcessMapInput!) {
    createProcessMap(input: $input) {
      id
      name
      outcome
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
const DEFAULT_PRODUCT_VAT = 0.2;
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
  ratio: number;
}

interface ProcessParameterData {
  id: string;
  name: string;
  value: string;
  unit: string;
}

interface IngredientData {
  id: string;
  product: { id: string; name: string } | null;
  material: { id: string; name: string; consumptionUnit: string } | null;
  amount: number;
  unit: string;
}

interface ProcessMapData {
  id: string;
  name: string;
  outcome: number;
  parameters: ProcessParameterData[];
  ingredients: IngredientData[];
}

interface ProcessMapPanelForm {
  name: string;
  outcome: string;
  marginalCoefficient: string;
  containerCost: string;
  productVat: string;
  productWeight: string;
  parameters: { name: string; value: string; unit: string }[];
  ingredients: { type: 'product' | 'material'; productId: string; materialId: string; amount: string }[];
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
      ratio: number;
    } | null;
  }>;
}

interface CostSettingsStorage {
  marginalCoefficient: number;
  containerCost: number;
  productVat: number;
  productWeight: number;
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
  processMaps: ProcessMapData[];
  processMapLoading: boolean;
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
  marginalCoefficient: String(DEFAULT_MARGINAL_COEFFICIENT),
  containerCost: String(DEFAULT_CONTAINER_COST),
  productVat: String(DEFAULT_PRODUCT_VAT),
  productWeight: String(DEFAULT_PRODUCT_WEIGHT),
  parameters: [],
  ingredients: [],
};

interface StaffProductsProps {
  userId?: string;
}

class StaffProducts extends Proto<StaffProductsProps, StaffProductsState> {
  private readonly fileInputRef = createRef<HTMLInputElement>();
  private readonly productUnitPriceCache = new Map<string, number>();
  private readonly processMapsForCostCache = new Map<string, ProcessMapForCost[]>();
  state: StaffProductsState = {
    products: [],
    materials: [],
    processMaps: [],
    processMapLoading: false,
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
    this.hydrateCostSettings();
    void this.fetchProducts();
  }

  private getCostSettingsStorageKey = () =>
    `staff-products:cost-settings:${this.props.userId ?? 'anonymous'}`;

  private hydrateCostSettings = () => {
    let parsed: CostSettingsStorage | null = null;
    try {
      const raw = window.localStorage.getItem(this.getCostSettingsStorageKey());
      if (raw) {
        const data = JSON.parse(raw) as Partial<CostSettingsStorage>;
        const marginalCoefficient = Number(data.marginalCoefficient);
        const containerCost = Number(data.containerCost);
        const productVat = Number(data.productVat);
        const productWeight = Number(data.productWeight);
        if (
          Number.isFinite(marginalCoefficient) &&
          Number.isFinite(containerCost) &&
          Number.isFinite(productVat) &&
          Number.isFinite(productWeight)
        ) {
          parsed = { marginalCoefficient, containerCost, productVat, productWeight };
        }
      }
    } catch {
      parsed = null;
    }

    if (!parsed) {
      return;
    }

    this.setState((prev) => ({
      processMapPanelForm: {
        ...prev.processMapPanelForm,
        marginalCoefficient: String(parsed.marginalCoefficient),
        containerCost: String(parsed.containerCost),
        productVat: String(parsed.productVat),
        productWeight: String(parsed.productWeight),
      },
    }));
  };

  private persistCostSettings = (
    marginalCoefficient: number,
    containerCost: number,
    productVat: number,
    productWeight: number
  ) => {
    try {
      window.localStorage.setItem(
        this.getCostSettingsStorageKey(),
        JSON.stringify({
          marginalCoefficient,
          containerCost,
          productVat,
          productWeight,
        })
      );
    } catch {
      // Ignore localStorage write errors.
    }
  };

  private getMaterialUnitPriceWithoutVat = (material: {
    VAT: number;
    Price: number;
    ratio: number;
    purchaseUnitAmount: number;
  }): number => {
    const vatFactor = 1 + material.VAT / 100;
    const priceWithoutVat = vatFactor > 0 ? material.Price / vatFactor : material.Price;
    let result = priceWithoutVat;
    if (material.ratio > 0) {
      result /= material.ratio;
    }
    if (material.purchaseUnitAmount > 0) {
      result /= material.purchaseUnitAmount;
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

  private computeProductUnitPriceWithoutVat = async (
    productId: string,
    marginalCoefficient: number,
    containerCost: number,
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

      const selectedMap = maps[0];
      const outcome = Number(selectedMap.outcome);
      if (!Number.isFinite(outcome) || outcome <= 0) {
        throw new Error('Referenced product process map outcome must be greater than zero.');
      }

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
            containerCost,
            visiting,
            applyMarginalCoefficient
          );
          ingredientsTotal += unitPrice * amount;
        }
      }

      const totalCostWithoutVat = applyMarginalCoefficient
        ? (ingredientsTotal + containerCost) * marginalCoefficient
        : (ingredientsTotal + containerCost);
      const unitPriceWithoutVat = totalCostWithoutVat / outcome;
      this.productUnitPriceCache.set(cacheKey, unitPriceWithoutVat);
      return unitPriceWithoutVat;
    } finally {
      visiting.delete(productId);
    }
  };

  private calculateProcessMapCost = async () => {
    const { processMapPanelForm } = this.state;
    const outcome = Number.parseFloat(processMapPanelForm.outcome);
    if (!Number.isFinite(outcome) || outcome <= 0) {
      this.setState({ error: 'Outcome must be greater than zero to calculate cost.' });
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
      this.setState({ error: 'Weight of product must be a non-negative number.' });
      return;
    }

    this.setState({ processMapCostCalculating: true, processMapCostResult: null, error: null });
    this.persistCostSettings(marginalCoefficient, containerCost, productVat, productWeight);
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
            containerCost,
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
      const costPerGramWithoutVat = (ingredientsTotal * marginalCoefficient) / outcome;
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
      this.setState({
        processMapCostCalculating: false,
        error: String(error),
      });
    }
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
      this.setState({
        loading: false,
        products: data.products as StaffProductData[],
        materials: data.materials as MaterialOption[],
      });
    } catch (error) {
      this.setState({ loading: false, error: String(error) });
    }
  };

  private loadProcessMaps = async (productId: string) => {
    this.setState({ processMapLoading: true, error: null });
    try {
      const data = await this.gql(PROCESS_MAPS_QUERY, { productId });
      this.setState({
        processMaps: data.processMaps as ProcessMapData[],
        processMapLoading: false,
      });
    } catch (error) {
      this.setState({ processMapLoading: false, error: String(error) });
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
    const { processMapPanelForm } = this.state;
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
      processMapPanelForm: {
        ...INITIAL_PROCESS_MAP_PANEL_FORM,
        marginalCoefficient: processMapPanelForm.marginalCoefficient,
        containerCost: processMapPanelForm.containerCost,
        productVat: processMapPanelForm.productVat,
        productWeight: processMapPanelForm.productWeight,
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
        marginalCoefficient: this.state.processMapPanelForm.marginalCoefficient,
        containerCost: this.state.processMapPanelForm.containerCost,
        productVat: this.state.processMapPanelForm.productVat,
        productWeight: this.state.processMapPanelForm.productWeight,
        parameters: pm.parameters.map(p => ({ name: p.name, value: p.value, unit: p.unit })),
        ingredients: pm.ingredients.map(ing => ({
          type: ing.product ? 'product' : 'material',
          productId: ing.product?.id ?? '',
          materialId: ing.material?.id ?? '',
          amount: String(ing.amount),
        })),
      },
      processMapCostResult: null,
    });
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

    this.setState({ processMapSaving: true, error: null });
    try {
      if (processMapPanel === 'create') {
        await this.gql(CREATE_PROCESS_MAP_MUTATION, {
          input: {
            productId: editingProduct.id,
            name: processMapPanelForm.name.trim(),
            outcome,
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
    }));
  };

  private removeIngredient = (idx: number) => {
    this.setState((prev) => ({
      processMapPanelForm: {
        ...prev.processMapPanelForm,
        ingredients: prev.processMapPanelForm.ingredients.filter((_, i) => i !== idx),
      },
      processMapCostResult: null,
    }));
  };

  private updateIngredient = (
    idx: number,
    field: 'type' | 'productId' | 'materialId' | 'amount',
    val: string
  ) => {
    this.setState((prev) => {
      const ingredients = prev.processMapPanelForm.ingredients.map((ing, i) => {
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
        }));
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
        }));
      }
    } catch (error) {
      this.setState({ saving: false, error: String(error) });
    }
  };

  render() {
    const {
      products,
      materials,
      processMaps,
      processMapLoading,
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

              <div className="material-grid">
                <label className="cj-label">
                  Calories (kcal)
                  <input
                    className="cj-input material-input"
                    type="number"
                    step="0.001"
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
                    step="0.001"
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
                    step="0.001"
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
                    step="0.001"
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
                    step="0.001"
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
                    step="0.001"
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
                    step="0.001"
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
                      processMaps.map(pm => (
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
                          </span>
                          <button type="button" className="cj-btn-sm" onClick={() => this.openEditProcessMap(pm.id)}>
                            Edit
                          </button>
                        </div>
                      ))
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
                            step="0.001"
                            value={processMapPanelForm.outcome}
                            onChange={(event) =>
                              this.setState({
                                processMapPanelForm: {
                                  ...processMapPanelForm,
                                  outcome: event.target.value,
                                },
                                processMapCostResult: null,
                              })
                            }
                            placeholder="Outcome"
                          />
                        </label>

                        <label className="cj-label" style={{ margin: 0 }}>
                          Marginal coeff
                          <input
                            className="cj-input batch-input-wide"
                            type="number"
                            step="0.0001"
                            value={processMapPanelForm.marginalCoefficient}
                            onChange={(event) =>
                              this.setState({
                                processMapPanelForm: {
                                  ...processMapPanelForm,
                                  marginalCoefficient: event.target.value,
                                },
                                processMapCostResult: null,
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
                            step="0.01"
                            value={processMapPanelForm.containerCost}
                            onChange={(event) =>
                              this.setState({
                                processMapPanelForm: {
                                  ...processMapPanelForm,
                                  containerCost: event.target.value,
                                },
                                processMapCostResult: null,
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
                            step="0.01"
                            value={processMapPanelForm.productVat}
                            onChange={(event) =>
                              this.setState({
                                processMapPanelForm: {
                                  ...processMapPanelForm,
                                  productVat: event.target.value,
                                },
                                processMapCostResult: null,
                              })
                            }
                            placeholder="VAT %"
                          />
                        </label>

                        <label className="cj-label" style={{ margin: 0 }}>
                          Weight (g)
                          <input
                            className="cj-input batch-input-wide"
                            type="number"
                            step="0.001"
                            min="0"
                            value={processMapPanelForm.productWeight}
                            onChange={(event) =>
                              this.setState({
                                processMapPanelForm: {
                                  ...processMapPanelForm,
                                  productWeight: event.target.value,
                                },
                                processMapCostResult: null,
                              })
                            }
                            placeholder="Weight g"
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
                            <div>Ingredients total (w/o VAT): {processMapCostResult.ingredientsTotal.toFixed(4)}</div>
                            <div>Cost / gram (w/o VAT): {processMapCostResult.costPerGramWithoutVat.toFixed(4)}</div>
                            <div>Cost for weight (w/o VAT): {processMapCostResult.weightedCostWithoutVat.toFixed(4)}</div>
                            <div>Total (w/o VAT): {processMapCostResult.totalCostWithoutVat.toFixed(4)}</div>
                            <div>Total (with VAT): <strong>{processMapCostResult.totalCostWithVat.toFixed(4)}</strong></div>
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
                              : 'gram';
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
                                step="0.001"
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
                                  unit: {costLine.unitPriceWithoutVat.toFixed(4)} | line: {costLine.lineCost.toFixed(4)}
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="cj-empty">
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