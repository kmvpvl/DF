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
  }
`;

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

class StaffProducts extends Proto<Record<string, never>, StaffProductsState> {
  private readonly fileInputRef = createRef<HTMLInputElement>();

  state: StaffProductsState = {
    products: [],
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
    void this.fetchProducts();
  }

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
      });
    } catch (error) {
      this.setState({ loading: false, error: String(error) });
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
    this.setState({
      adding: true,
      editingProduct: null,
      form: { ...INITIAL_FORM },
      error: null,
    });
  };

  private openEditForm = (product: StaffProductData) => {
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
    });
  };

  private closeForm = () => {
    this.setState({
      adding: false,
      editingProduct: null,
      form: { ...INITIAL_FORM },
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