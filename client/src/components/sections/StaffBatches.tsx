import Proto from '../../proto';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/graphql`;

const INITIAL_QUERY = `
  query {
    products {
      id
      name
      batchPrefix
    }
    storageConditions {
      id
      name
    }
    batches {
      id
      number
      numberStr
      nettoWeight
      storageDurationHours
      processDeviations
      createdAt
      updatedAt
      product {
        id
        name
        batchPrefix
      }
      storageCondition {
        id
        name
      }
      processMap {
        id
        name
        parameters {
          id
          name
          value
          unit
        }
      }
    }
    costSettings {
      productMainProcessMaps
    }
  }
`;

const NEXT_BATCH_PREVIEW_QUERY = `
  query($productId: ID!) {
    nextBatchPreview(productId: $productId) {
      number
      numberStr
    }
  }
`;

const PROCESS_MAPS_QUERY = `
  query($productId: ID!) {
    processMaps(productId: $productId) {
      id
      name
      rateOfLoss
      parameters {
        id
        name
        value
        unit
      }
      ingredients {
        id
        amount
        unit
        product {
          id
          name
        }
        material {
          id
          name
        }
      }
    }
  }
`;

const CREATE_BATCH_MUTATION = `
  mutation($input: CreateBatchInput!) {
    createBatch(input: $input) {
      id
      number
      numberStr
      samples {
        numberStr
      }
    }
  }
`;

const UPDATE_BATCH_MUTATION = `
  mutation($id: ID!, $input: UpdateBatchInput!) {
    updateBatch(id: $id, input: $input) {
      id
      updatedAt
    }
  }
`;

interface BatchProductOption {
  id: string;
  name: string;
  batchPrefix: string;
}

interface StorageConditionOption {
  id: string;
  name: string;
}

interface BatchPreview {
  number: number;
  numberStr: string;
}

interface CreatedSampleInfo {
  numberStr: string;
}

interface ProcessParameterData {
  id: string;
  name: string;
  value: string;
  unit: string;
}

interface ProcessMapData {
  id: string;
  name: string;
  rateOfLoss: number;
  parameters: ProcessParameterData[];
  ingredients: {
    id: string;
    amount: number;
    unit: string;
    product: { id: string; name: string } | null;
    material: { id: string; name: string } | null;
  }[];
}

interface CalculatedIngredientLine {
  id: string;
  name: string;
  amount: number;
  unit: string;
}

interface StaffBatchData {
  id: string;
  number: number;
  numberStr: string;
  nettoWeight: number;
  storageDurationHours: number;
  processDeviations: string | null;
  createdAt: string;
  updatedAt: string;
  product: BatchProductOption;
  storageCondition: StorageConditionOption;
  processMap: ProcessMapData | null;
}

interface BatchForm {
  productId: string;
  nettoWeight: string;
  storageDurationHours: string;
  storageConditionId: string;
  storageConditionName: string;
  processDeviations: string;
  processMapId: string;
  sampleCount: string;
}

interface StaffBatchesState {
  products: BatchProductOption[];
  storageConditions: StorageConditionOption[];
  batches: StaffBatchData[];
  loading: boolean;
  saving: boolean;
  previewLoading: boolean;
  error: string | null;
  notice: string | null;
  adding: boolean;
  editingBatch: StaffBatchData | null;
  nextBatchPreview: BatchPreview | null;
  form: BatchForm;
  processMaps: ProcessMapData[];
  processMapLoading: boolean;
  productMainProcessMapById: Record<string, string>;
  calculatedIngredients: CalculatedIngredientLine[];
  calculatedProcessMapName: string;
  calculatedInputWeight: number | null;
  calculatedRateOfLoss: number | null;
}

const INITIAL_FORM: BatchForm = {
  productId: '',
  nettoWeight: '',
  storageDurationHours: '',
  storageConditionId: '',
  storageConditionName: '',
  processDeviations: '',
  processMapId: '',
  sampleCount: '0',
};

class StaffBatches extends Proto<Record<string, never>, StaffBatchesState> {
  state: StaffBatchesState = {
    products: [],
    storageConditions: [],
    batches: [],
    loading: false,
    saving: false,
    previewLoading: false,
    error: null,
    notice: null,
    adding: false,
    editingBatch: null,
    nextBatchPreview: null,
    form: { ...INITIAL_FORM },
    processMaps: [],
    processMapLoading: false,
    productMainProcessMapById: {},
    calculatedIngredients: [],
    calculatedProcessMapName: '',
    calculatedInputWeight: null,
    calculatedRateOfLoss: null,
  };

  componentDidMount() {
    void this.fetchData();
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

  private fetchData = async () => {
    this.setState({ loading: true, error: null });

    try {
      const data = await this.gql(INITIAL_QUERY);
      this.setState({
        loading: false,
        products: data.products as BatchProductOption[],
        storageConditions: data.storageConditions as StorageConditionOption[],
        batches: data.batches as StaffBatchData[],
        productMainProcessMapById: (() => {
          try {
            const raw = (data.costSettings as { productMainProcessMaps?: string } | undefined)?.productMainProcessMaps ?? '{}';
            const parsed = JSON.parse(raw) as Record<string, string>;
            return Object.fromEntries(
              Object.entries(parsed)
                .map(([productId, processMapId]) => [productId, String(processMapId)] as const)
                .filter((entry) => entry[1].trim().length > 0)
            );
          } catch {
            return {};
          }
        })(),
      });
    } catch (error) {
      this.setState({ loading: false, error: String(error) });
    }
  };

  private loadNextBatchPreview = async (productId: string) => {
    if (!productId) {
      this.setState({ nextBatchPreview: null, previewLoading: false });
      return;
    }

    this.setState({ previewLoading: true, error: null, nextBatchPreview: null });
    try {
      const data = await this.gql(NEXT_BATCH_PREVIEW_QUERY, { productId });
      this.setState({
        previewLoading: false,
        nextBatchPreview: data.nextBatchPreview as BatchPreview,
      });
    } catch (error) {
      this.setState({ previewLoading: false, error: String(error) });
    }
  };

  private loadProcessMaps = async (productId: string) => {
    if (!productId) {
      this.setState({ processMaps: [], processMapLoading: false });
      return;
    }
    this.setState({ processMapLoading: true });
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

  private openCreateForm = () => {
    this.setState({
      adding: true,
      editingBatch: null,
      nextBatchPreview: null,
      form: { ...INITIAL_FORM },
      error: null,
      notice: null,
      processMaps: [],
      calculatedIngredients: [],
      calculatedProcessMapName: '',
      calculatedInputWeight: null,
      calculatedRateOfLoss: null,
    });
  };

  private openEditForm = (batch: StaffBatchData) => {
    this.setState({
      adding: false,
      editingBatch: batch,
      nextBatchPreview: null,
      error: null,
      notice: null,
      processMaps: [],
      calculatedIngredients: [],
      calculatedProcessMapName: '',
      calculatedInputWeight: null,
      calculatedRateOfLoss: null,
      form: {
        productId: batch.product.id,
        nettoWeight: String(batch.nettoWeight),
        storageDurationHours: String(batch.storageDurationHours),
        storageConditionId: batch.storageCondition.id,
        storageConditionName: '',
        processDeviations: batch.processDeviations ?? '',
        processMapId: batch.processMap?.id ?? '',
        sampleCount: '0',
      },
    });
    void this.loadProcessMaps(batch.product.id);
  };

  private closeForm = () => {
    this.setState({
      adding: false,
      editingBatch: null,
      nextBatchPreview: null,
      form: { ...INITIAL_FORM },
      processMaps: [],
      calculatedIngredients: [],
      calculatedProcessMapName: '',
      calculatedInputWeight: null,
      calculatedRateOfLoss: null,
    });
  };

  private handleCreateProductChange = async (productId: string) => {
    this.setState((prevState) => ({
      form: { ...prevState.form, productId, processMapId: '' },
      calculatedIngredients: [],
      calculatedProcessMapName: '',
      calculatedInputWeight: null,
      calculatedRateOfLoss: null,
    }));
    await Promise.all([
      this.loadNextBatchPreview(productId),
      this.loadProcessMaps(productId),
    ]);
  };

  private calculateIngredientsForBatch = () => {
    const {
      form,
      processMaps,
      productMainProcessMapById,
    } = this.state;

    const nettoWeight = Number.parseFloat(form.nettoWeight);
    if (!Number.isFinite(nettoWeight) || nettoWeight <= 0) {
      this.setState({ error: 'Enter a valid netto weight before calculating ingredients.' });
      return;
    }

    if (!form.productId) {
      this.setState({ error: 'Select a product before calculating ingredients.' });
      return;
    }

    if (processMaps.length === 0) {
      this.setState({ error: 'No process maps available for the selected product.' });
      return;
    }

    const selectedMapId = form.processMapId || productMainProcessMapById[form.productId] || '';
    const selectedMap = processMaps.find((pm) => pm.id === selectedMapId);
    if (!selectedMap) {
      this.setState({ error: 'Choose a process map or set a main process map for this product.' });
      return;
    }

    const ingredientAmountSum = selectedMap.ingredients.reduce((sum, ingredient) => {
      const amount = Number(ingredient.amount);
      return Number.isFinite(amount) && amount > 0 ? sum + amount : sum;
    }, 0);

    if (!Number.isFinite(ingredientAmountSum) || ingredientAmountSum <= 0) {
      this.setState({ error: 'Selected process map has no valid ingredient proportions.' });
      return;
    }

    const mapRateOfLoss = Number(selectedMap.rateOfLoss);
    const effectiveRateOfLoss =
      Number.isFinite(mapRateOfLoss) && mapRateOfLoss >= 0 && mapRateOfLoss < 100
        ? mapRateOfLoss
        : 0;
    const requiredInputWeight = nettoWeight / (1 - effectiveRateOfLoss / 100);

    const calculatedIngredients = selectedMap.ingredients
      .map((ingredient) => {
        const amount = Number(ingredient.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
          return null;
        }
        const proportion = amount / ingredientAmountSum;
        return {
          id: ingredient.id,
          name: ingredient.product?.name ?? ingredient.material?.name ?? 'Unknown ingredient',
          amount: requiredInputWeight * proportion,
          unit: ingredient.unit,
        };
      })
      .filter((ingredient): ingredient is CalculatedIngredientLine => ingredient !== null);

    this.setState({
      error: null,
      calculatedIngredients,
      calculatedProcessMapName: selectedMap.name,
      calculatedInputWeight: requiredInputWeight,
      calculatedRateOfLoss: effectiveRateOfLoss,
    });
  };

  private renderCalculatedIngredients() {
    const {
      calculatedIngredients,
      calculatedProcessMapName,
      calculatedInputWeight,
      calculatedRateOfLoss,
      form,
    } = this.state;

    if (calculatedIngredients.length === 0) {
      return null;
    }

    const nettoWeight = Number.parseFloat(form.nettoWeight);

    return (
      <div className="batch-preview-box batch-ingredients-box">
        <strong>Ingredients calculation</strong>
        <div>Process map: {calculatedProcessMapName}</div>
        <div>Netto weight target: {Number.isFinite(nettoWeight) ? this.toFixed(nettoWeight) : form.nettoWeight}</div>
        <div>Rate of loss: {this.toInteger((calculatedRateOfLoss ?? 0))}%</div>
        <div>Required total input: {this.toFixed(calculatedInputWeight ?? 0)}</div>
        <ul className="batch-ingredients-list">
          {calculatedIngredients.map((ingredient) => (
            <li key={ingredient.id}>
              {ingredient.name}: {this.toCurrency(ingredient.amount)} {ingredient.unit}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  private saveBatch = async () => {
    const { adding, editingBatch, form } = this.state;
    const nettoWeight = Number.parseFloat(form.nettoWeight);
    const storageDurationHours = Number.parseInt(form.storageDurationHours, 10);
    const sampleCount = Number.parseInt(form.sampleCount, 10);

    if (
      (adding && !form.productId) ||
      !Number.isFinite(nettoWeight) ||
      nettoWeight <= 0 ||
      !Number.isInteger(storageDurationHours) ||
      storageDurationHours < 0 ||
      (adding && (!Number.isInteger(sampleCount) || sampleCount < 0)) ||
      (!form.storageConditionId.trim() && !form.storageConditionName.trim())
    ) {
      this.setState({
        error:
          'Choose a product, enter valid weight/storage duration/sample count, and select or enter a storage condition.',
      });
      return;
    }

    this.setState({ saving: true, error: null, notice: null });

    try {
      if (adding) {
        const data = await this.gql(CREATE_BATCH_MUTATION, {
          input: {
            productId: form.productId,
            nettoWeight,
            storageDurationHours,
            storageConditionId: form.storageConditionId.trim() || null,
            storageConditionName: form.storageConditionName.trim() || null,
            processDeviations: form.processDeviations.trim() || null,
            processMapId: form.processMapId.trim() || null,
            sampleCount,
          },
        });

        const createdBatch = data.createBatch as { samples?: CreatedSampleInfo[] };
        const createdSampleNumbers = (createdBatch.samples ?? []).map(sample => sample.numberStr);

        await this.fetchData();
        this.setState({
          saving: false,
          adding: false,
          editingBatch: null,
          nextBatchPreview: null,
          form: { ...INITIAL_FORM },
          notice:
            createdSampleNumbers.length > 0
              ? `Batch created. Samples: ${createdSampleNumbers.join(', ')}`
              : 'Batch created. No samples created.',
        });
        return;
      } else if (editingBatch) {
        await this.gql(UPDATE_BATCH_MUTATION, {
          id: editingBatch.id,
          input: {
            nettoWeight,
            storageDurationHours,
            storageConditionId: form.storageConditionId.trim() || null,
            storageConditionName: form.storageConditionName.trim() || null,
            processDeviations: form.processDeviations.trim() || null,
            processMapId: form.processMapId.trim() || null,
          },
        });
      }

      await this.fetchData();
      this.setState({
        saving: false,
        adding: false,
        editingBatch: null,
        nextBatchPreview: null,
        form: { ...INITIAL_FORM },
        notice: adding ? 'Batch created.' : 'Batch updated.',
      });
    } catch (error) {
      this.setState({ saving: false, error: String(error) });
    }
  };

  private renderBatchPreview() {
    const { form, nextBatchPreview, previewLoading } = this.state;
    if (!form.productId) {
      return <div className="batch-preview-box">Choose a product to generate the next batch number.</div>;
    }

    if (previewLoading) {
      return <div className="batch-preview-box">Generating next batch number...</div>;
    }

    if (!nextBatchPreview) {
      return null;
    }

    return (
      <div className="batch-preview-box">
        <strong>Next batch:</strong> {nextBatchPreview.numberStr}
      </div>
    );
  }

  render() {
    const {
      products,
      storageConditions,
      batches,
      loading,
      saving,
      error,
      notice,
      adding,
      editingBatch,
      form,
      processMaps,
      processMapLoading,
      calculatedIngredients,
    } = this.state;

    return (
      <div className="cleaning-journal">
        <div className="cj-header">
          <p className="section-label">Batches</p>
          <h1 className="section-title cj-title">Batches</h1>
        </div>

        <div className="cj-panel">
          <div className="cj-panel-header">
            <h2 className="cj-panel-title">Batch list</h2>
            {!adding && !editingBatch && (
              <button className="btn-primary cj-add-btn" onClick={this.openCreateForm}>
                + Add batch
              </button>
            )}
          </div>

          {error && <div className="cj-error">{error}</div>}
          {notice && <div className="cj-success">{notice}</div>}

          {(adding || editingBatch) && (
            <form
              className="material-form"
              onSubmit={(event) => {
                event.preventDefault();
                void this.saveBatch();
              }}
            >
              {adding ? (
                <label className="cj-label">
                  Product
                  <select
                    className="cj-select batch-select"
                    value={form.productId}
                    onChange={(event) => {
                      void this.handleCreateProductChange(event.target.value);
                    }}
                    required
                  >
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.batchPrefix})
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="batch-preview-box">
                  <strong>Product:</strong> {editingBatch?.product.name} ({editingBatch?.product.batchPrefix})
                  <br />
                  <strong>Batch number:</strong> {editingBatch?.numberStr}
                </div>
              )}

              {adding && this.renderBatchPreview()}

              <div className="material-grid">
                <label className="cj-label">
                  Netto weight
                  <input
                    className="cj-input material-input"
                    type="number"
                    step="0.001"
                    value={form.nettoWeight}
                    onChange={(event) =>
                      this.setState({
                        form: { ...form, nettoWeight: event.target.value },
                        calculatedIngredients: [],
                        calculatedProcessMapName: '',
                        calculatedInputWeight: null,
                        calculatedRateOfLoss: null,
                      })
                    }
                    required
                  />
                  {adding && (
                    <button
                      type="button"
                      className="btn-outline"
                      style={{ marginTop: '8px' }}
                      onClick={this.calculateIngredientsForBatch}
                    >
                      Calculate ingredients
                    </button>
                  )}
                </label>

                <label className="cj-label">
                  Storage duration (hours)
                  <input
                    className="cj-input material-input"
                    type="number"
                    step="1"
                    min="0"
                    value={form.storageDurationHours}
                    onChange={(event) =>
                      this.setState({ form: { ...form, storageDurationHours: event.target.value } })
                    }
                    required
                  />
                </label>

                {adding && (
                  <label className="cj-label">
                    New samples count
                    <input
                      className="cj-input material-input"
                      type="number"
                      step="1"
                      min="0"
                      value={form.sampleCount}
                      onChange={(event) =>
                        this.setState({ form: { ...form, sampleCount: event.target.value } })
                      }
                      required
                    />
                  </label>
                )}
              </div>

              <label className="cj-label">
                Storage condition
                <select
                  className="cj-select batch-select"
                  value={form.storageConditionId}
                  onChange={(event) =>
                    this.setState({
                      form: {
                        ...form,
                        storageConditionId: event.target.value,
                        storageConditionName: event.target.value ? '' : form.storageConditionName,
                      },
                    })
                  }
                >
                  <option value="">Enter manually</option>
                  {storageConditions.map((condition) => (
                    <option key={condition.id} value={condition.id}>
                      {condition.name}
                    </option>
                  ))}
                </select>
              </label>

              {!form.storageConditionId && (
                <label className="cj-label">
                  New storage condition
                  <input
                    className="cj-input batch-input-wide"
                    type="text"
                    value={form.storageConditionName}
                    onChange={(event) =>
                      this.setState({
                        form: { ...form, storageConditionName: event.target.value },
                      })
                    }
                    placeholder="Enter storage condition name"
                  />
                </label>
              )}

              <label className="cj-label">
                Process deviations
                <textarea
                  className="cj-input material-textarea"
                  value={form.processDeviations}
                  onChange={(event) =>
                    this.setState({ form: { ...form, processDeviations: event.target.value } })
                  }
                />
              </label>

              {form.productId && (
                <div className="cj-label">
                  <span>Process map</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                    <select
                      className="cj-select batch-select"
                      value={form.processMapId}
                      disabled={processMapLoading}
                      onChange={(event) =>
                        this.setState({
                          form: { ...form, processMapId: event.target.value },
                          calculatedIngredients: [],
                          calculatedProcessMapName: '',
                          calculatedInputWeight: null,
                          calculatedRateOfLoss: null,
                        })
                      }
                    >
                      <option value="">None</option>
                      {processMaps.map((pm) => (
                        <option key={pm.id} value={pm.id}>
                          {pm.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {adding && calculatedIngredients.length > 0 && this.renderCalculatedIngredients()}

              <div className="material-actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : adding ? 'Create batch' : 'Update batch'}
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
                  <th>Batch</th>
                  <th>Product</th>
                  <th>Netto</th>
                  <th>Storage</th>
                  <th>Condition</th>
                  <th>Process map</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="cj-empty">
                      No batch records yet.
                    </td>
                  </tr>
                ) : (
                  batches.map((batch) => (
                    <tr key={batch.id}>
                      <td>
                        <strong>{batch.numberStr}</strong>
                        {batch.processDeviations ? (
                          <div className="material-description">{batch.processDeviations}</div>
                        ) : null}
                      </td>
                      <td>{batch.product.name}</td>
                      <td>{batch.nettoWeight}</td>
                      <td>{batch.storageDurationHours} h</td>
                      <td>{batch.storageCondition.name}</td>
                      <td>
                        {batch.processMap ? (
                          <span title={batch.processMap.parameters.map(p => `${p.name}: ${p.value} ${p.unit}`).join('\n')}>
                            {batch.processMap.name}
                          </span>
                        ) : (
                          <span className="cj-empty">—</span>
                        )}
                      </td>
                      <td>{this.toLocalDate(batch.createdAt)}</td>
                      <td className="cj-row-actions">
                        <button className="cj-btn-sm" onClick={() => this.openEditForm(batch)}>
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

export default StaffBatches;