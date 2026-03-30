import { type ChangeEvent, createRef } from 'react';
import Proto from '../../proto';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/graphql`;

const MATERIAL_FIELDS = `
  id
  name
  description
  selfProduced
  caloriesKcal
  fatGrams
  proteinGrams
  carbohydratesGrams
  sugarsGrams
  fiberGrams
  saltGrams
  VAT
  Price
  purchaseUnit
  purchaseUnitAmount
  consumptionUnit
  ratio
  createdAt
  updatedAt
`;

const MATERIALS_QUERY = `
  query {
    materials {
      ${MATERIAL_FIELDS}
    }
  }
`;

const CREATE_MATERIAL_MUTATION = `
  mutation($input: CreateMaterialInput!) {
    createMaterial(input: $input) {
      ${MATERIAL_FIELDS}
    }
  }
`;

const UPDATE_MATERIAL_MUTATION = `
  mutation($id: ID!, $input: UpdateMaterialInput!) {
    updateMaterial(id: $id, input: $input) {
      ${MATERIAL_FIELDS}
    }
  }
`;

const DELETE_MATERIAL_MUTATION = `
  mutation($id: ID!) {
    deleteMaterial(id: $id)
  }
`;

const MATERIALS_CSV_QUERY = `
  query {
    materialsCsv
  }
`;

const IMPORT_MATERIALS_CSV_MUTATION = `
  mutation($csv: String!, $overwriteExisting: Boolean) {
    importMaterialsCsv(csv: $csv, overwriteExisting: $overwriteExisting) {
      importedCount
      skippedCount
      errors
    }
  }
`;

interface MaterialData {
  id: string;
  name: string;
  description: string | null;
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
  createdAt: string;
  updatedAt: string;
}

interface MaterialForm {
  name: string;
  description: string;
  selfProduced: boolean;
  caloriesKcal: string;
  fatGrams: string;
  proteinGrams: string;
  carbohydratesGrams: string;
  sugarsGrams: string;
  fiberGrams: string;
  saltGrams: string;
  VAT: string;
  Price: string;
  purchaseUnit: string;
  purchaseUnitAmount: string;
  consumptionUnit: string;
  ratio: string;
}

interface ImportMaterialsCsvResult {
  importedCount: number;
  skippedCount: number;
  errors: string[];
}

interface MaterialState {
  materials: MaterialData[];
  loading: boolean;
  saving: boolean;
  csvProcessing: boolean;
  error: string | null;
  csvResult: string | null;
  adding: boolean;
  editingMaterial: MaterialData | null;
  form: MaterialForm;
}

const INITIAL_FORM: MaterialForm = {
  name: '',
  description: '',
  selfProduced: false,
  caloriesKcal: '0',
  fatGrams: '0',
  proteinGrams: '0',
  carbohydratesGrams: '0',
  sugarsGrams: '0',
  fiberGrams: '0',
  saltGrams: '0',
  VAT: '',
  Price: '',
  purchaseUnit: '',
  purchaseUnitAmount: '',
  consumptionUnit: '',

  ratio: '',
};

class Material extends Proto<Record<string, never>, MaterialState> {
  private readonly fileInputRef = createRef<HTMLInputElement>();

  state: MaterialState = {
    materials: [],
    loading: false,
    saving: false,
    csvProcessing: false,
    error: null,
    csvResult: null,
    adding: false,
    editingMaterial: null,
    form: { ...INITIAL_FORM },
  };

  componentDidMount() {
    void this.fetchMaterials();
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

  private fetchMaterials = async () => {
    this.setState({ loading: true, error: null });

    try {
      const data = await this.gql(MATERIALS_QUERY);
      this.setState({
        loading: false,
        materials: data.materials as MaterialData[],
      });
    } catch (error) {
      this.setState({ loading: false, error: String(error) });
    }
  };

  private exportMaterialsCsv = async () => {
    this.setState({ csvProcessing: true, error: null, csvResult: null });

    try {
      const data = await this.gql(MATERIALS_CSV_QUERY);
      const csv = String(data.materialsCsv ?? '');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `materials-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      this.setState({
        csvProcessing: false,
        csvResult: 'Materials exported to CSV.',
      });
    } catch (error) {
      this.setState({
        csvProcessing: false,
        error: String(error),
      });
    }
  };

  private openImportPicker = () => {
    this.fileInputRef.current?.click();
  };

  private importMaterialsCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    this.setState({ csvProcessing: true, error: null, csvResult: null });

    try {
      const csv = await file.text();
      const data = await this.gql(IMPORT_MATERIALS_CSV_MUTATION, {
        csv,
        overwriteExisting: true,
      });

      const result = data.importMaterialsCsv as ImportMaterialsCsvResult;
      await this.fetchMaterials();

      const summary = `Imported ${result.importedCount}, skipped ${result.skippedCount}.`;
      const details = result.errors.length > 0 ? ` Errors: ${result.errors.join(' | ')}` : '';

      this.setState({
        csvProcessing: false,
        csvResult: `${summary}${details}`,
      });
    } catch (error) {
      this.setState({
        csvProcessing: false,
        error: String(error),
      });
    }
  };

  private openCreateForm = () => {
    this.setState({
      adding: true,
      editingMaterial: null,
      form: { ...INITIAL_FORM },
      error: null,
    });
  };

  private openEditForm = (material: MaterialData) => {
    this.setState({
      adding: false,
      editingMaterial: material,
      error: null,
      form: {
        name: material.name,
        description: material.description ?? '',
        selfProduced: material.selfProduced,
        caloriesKcal: String(material.caloriesKcal),
        fatGrams: String(material.fatGrams),
        proteinGrams: String(material.proteinGrams),
        carbohydratesGrams: String(material.carbohydratesGrams),
        sugarsGrams: String(material.sugarsGrams),
        fiberGrams: String(material.fiberGrams),
        saltGrams: String(material.saltGrams),
        VAT: String(material.VAT),
        Price: String(material.Price),
        purchaseUnit: material.purchaseUnit ?? '',
        purchaseUnitAmount: String(material.purchaseUnitAmount),
        consumptionUnit: material.consumptionUnit ?? '',
        ratio: String(material.ratio),
      },
    });
  };

  private closeForm = () => {
    this.setState({
      adding: false,
      editingMaterial: null,
      form: { ...INITIAL_FORM },
    });
  };

  private saveMaterial = async () => {
    const { form, editingMaterial } = this.state;

    const caloriesKcal = Number.parseFloat(form.caloriesKcal);
    const fatGrams = Number.parseFloat(form.fatGrams);
    const proteinGrams = Number.parseFloat(form.proteinGrams);
    const carbohydratesGrams = Number.parseFloat(form.carbohydratesGrams);
    const sugarsGrams = Number.parseFloat(form.sugarsGrams);
    const fiberGrams = Number.parseFloat(form.fiberGrams);
    const saltGrams = Number.parseFloat(form.saltGrams);
    const vat = Number.parseFloat(form.VAT);
    const price = Number.parseFloat(form.Price);
    const purchaseUnitAmount = Number.parseFloat(form.purchaseUnitAmount);
    const ratio = Number.parseFloat(form.ratio);

    if (
      !form.name.trim() ||
      !form.description.trim() ||
      !form.purchaseUnit.trim() ||
      !form.consumptionUnit.trim() ||
      !Number.isFinite(caloriesKcal) ||
      !Number.isFinite(fatGrams) ||
      !Number.isFinite(proteinGrams) ||
      !Number.isFinite(carbohydratesGrams) ||
      !Number.isFinite(sugarsGrams) ||
      !Number.isFinite(fiberGrams) ||
      !Number.isFinite(saltGrams) ||
      !Number.isFinite(vat) ||
      !Number.isFinite(price) ||
      !Number.isFinite(purchaseUnitAmount) ||
      !Number.isFinite(ratio)
    ) {
      this.setState({
        error: 'Please fill all required fields with valid numeric values.',
      });
      return;
    }

    this.setState({ saving: true, error: null });

    const input = {
      name: form.name.trim(),
      description: form.description.trim(),
      selfProduced: form.selfProduced,
      caloriesKcal,
      fatGrams,
      proteinGrams,
      carbohydratesGrams,
      sugarsGrams,
      fiberGrams,
      saltGrams,
      VAT: vat,
      Price: price,
      purchaseUnit: form.purchaseUnit.trim(),
      purchaseUnitAmount,
      consumptionUnit: form.consumptionUnit.trim(),
      ratio,
    };

    try {
      if (editingMaterial) {
        const data = await this.gql(UPDATE_MATERIAL_MUTATION, {
          id: editingMaterial.id,
          input,
        });
        const updated = data.updateMaterial as MaterialData;

        this.setState((prevState) => ({
          saving: false,
          editingMaterial: null,
          adding: false,
          form: { ...INITIAL_FORM },
          materials: prevState.materials
            .map((material) => (material.id === updated.id ? updated : material))
            .sort((a, b) => a.name.localeCompare(b.name)),
        }));
      } else {
        const data = await this.gql(CREATE_MATERIAL_MUTATION, { input });
        const created = data.createMaterial as MaterialData;

        this.setState((prevState) => ({
          saving: false,
          adding: false,
          form: { ...INITIAL_FORM },
          materials: [...prevState.materials, created].sort((a, b) =>
            a.name.localeCompare(b.name)
          ),
        }));
      }
    } catch (error) {
      this.setState({ saving: false, error: String(error) });
    }
  };

  private deleteMaterial = async (materialId: string) => {
    if (!confirm('Delete this material? This cannot be undone.')) {
      return;
    }

    try {
      await this.gql(DELETE_MATERIAL_MUTATION, { id: materialId });
      this.setState((prevState) => ({
        materials: prevState.materials.filter(
          (material) => material.id !== materialId
        ),
      }));
    } catch (error) {
      this.setState({ error: String(error) });
    }
  };

  render() {
    const {
      materials,
      loading,
      saving,
      csvProcessing,
      error,
      csvResult,
      adding,
      editingMaterial,
      form,
    } =
      this.state;

    return (
      <div className="cleaning-journal">
        <div className="cj-header">
          <p className="section-label">Material</p>
          <h1 className="section-title cj-title">Material</h1>
        </div>

        <div className="cj-panel">
          <div className="cj-panel-header">
            <h2 className="cj-panel-title">Material list</h2>
            <div className="material-panel-actions">
              <button
                className="btn-outline cj-add-btn"
                onClick={() => void this.exportMaterialsCsv()}
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
              {!adding && !editingMaterial && (
                <button className="btn-primary cj-add-btn" onClick={this.openCreateForm}>
                  + Add material
                </button>
              )}
            </div>
            <input
              ref={this.fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="material-file-input"
              onChange={(event) => {
                void this.importMaterialsCsv(event);
              }}
            />
          </div>

          {error && <div className="cj-error">{error}</div>}
          {csvResult && <div className="cj-success">{csvResult}</div>}

          {(adding || editingMaterial) && (
            <form
              className="material-form"
              onSubmit={(event) => {
                event.preventDefault();
                void this.saveMaterial();
              }}
            >
              <label className="cj-label">
                Name
                <input
                  className="cj-input material-input"
                  type="text"
                  value={form.name}
                  onChange={(event) => this.setState({ form: { ...form, name: event.target.value } })}
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

              <label className="cj-label material-checkbox-label">
                <input
                  className="material-checkbox"
                  type="checkbox"
                  checked={form.selfProduced}
                  onChange={(event) =>
                    this.setState({ form: { ...form, selfProduced: event.target.checked } })
                  }
                />
                Self produced
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

                <label className="cj-label">
                  VAT
                  <input
                    className="cj-input material-input"
                    type="number"
                    step="0.01"
                    value={form.VAT}
                    onChange={(event) =>
                      this.setState({ form: { ...form, VAT: event.target.value } })
                    }
                    required
                  />
                </label>

                <label className="cj-label">
                  Price
                  <input
                    className="cj-input material-input"
                    type="number"
                    step="0.01"
                    value={form.Price}
                    onChange={(event) =>
                      this.setState({ form: { ...form, Price: event.target.value } })
                    }
                    required
                  />
                </label>

                <label className="cj-label">
                  Purchase unit
                  <input
                    className="cj-input material-input"
                    type="text"
                    value={form.purchaseUnit}
                    onChange={(event) =>
                      this.setState({ form: { ...form, purchaseUnit: event.target.value } })
                    }
                    required
                  />
                </label>

                <label className="cj-label">
                  Purchase unit amount
                  <input
                    className="cj-input material-input"
                    type="number"
                    step="0.01"
                    value={form.purchaseUnitAmount}
                    onChange={(event) =>
                      this.setState({ form: { ...form, purchaseUnitAmount: event.target.value } })
                    }
                    required
                  />
                </label>

                <label className="cj-label">
                  Consumption unit
                  <input
                    className="cj-input material-input"
                    type="text"
                    value={form.consumptionUnit}
                    onChange={(event) =>
                      this.setState({ form: { ...form, consumptionUnit: event.target.value } })
                    }
                    required
                  />
                </label>

                <label className="cj-label">
                  Ratio
                  <input
                    className="cj-input material-input"
                    type="number"
                    step="0.0001"
                    value={form.ratio}
                    onChange={(event) =>
                      this.setState({ form: { ...form, ratio: event.target.value } })
                    }
                    required
                  />
                </label>
              </div>

              <div className="material-actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingMaterial ? 'Update material' : 'Create material'}
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
                  <th>kcal</th>
                  <th>Fat</th>
                  <th>Protein</th>
                  <th>Carbs</th>
                  <th>Price</th>
                  <th>VAT</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {materials.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="cj-empty">
                      No material records yet.
                    </td>
                  </tr>
                ) : (
                  materials.map((material) => (
                    <tr key={material.id}>
                      <td>
                        <strong>{material.name}</strong>
                        {material.description ? (
                          <div className="material-description">{material.description}</div>
                        ) : null}
                      </td>
                      <td>{material.caloriesKcal}</td>
                      <td>{material.fatGrams}</td>
                      <td>{material.proteinGrams}</td>
                      <td>{material.carbohydratesGrams}</td>
                      <td>{material.Price.toFixed(2)}</td>
                      <td>{material.VAT.toFixed(2)}</td>
                      <td className="cj-row-actions">
                        <button className="cj-btn-sm" onClick={() => this.openEditForm(material)}>
                          Edit
                        </button>
                        <button
                          className="cj-btn-sm cj-btn-danger"
                          onClick={() => void this.deleteMaterial(material.id)}
                        >
                          Delete
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

export default Material;
