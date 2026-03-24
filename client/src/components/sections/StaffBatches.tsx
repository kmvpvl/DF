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
      parameters {
        id
        name
        value
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
      parameters {
        id
        name
        value
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
      parameters {
        id
        name
        value
        unit
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
  parameters: ProcessParameterData[];
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

interface ProcessMapPanelForm {
  name: string;
  parameters: { name: string; value: string; unit: string }[];
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
  processMapPanel: 'none' | 'create' | 'edit';
  processMapPanelForm: ProcessMapPanelForm;
  processMapSaving: boolean;
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

const INITIAL_PROCESS_MAP_PANEL_FORM: ProcessMapPanelForm = {
  name: '',
  parameters: [],
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
    processMapPanel: 'none',
    processMapPanelForm: { ...INITIAL_PROCESS_MAP_PANEL_FORM },
    processMapSaving: false,
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
      processMapPanel: 'none',
      processMapPanelForm: { ...INITIAL_PROCESS_MAP_PANEL_FORM },
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
      processMapPanel: 'none',
      processMapPanelForm: { ...INITIAL_PROCESS_MAP_PANEL_FORM },
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
      processMapPanel: 'none',
      processMapPanelForm: { ...INITIAL_PROCESS_MAP_PANEL_FORM },
    });
  };

  private handleCreateProductChange = async (productId: string) => {
    this.setState((prevState) => ({
      form: { ...prevState.form, productId, processMapId: '' },
      processMapPanel: 'none',
      processMapPanelForm: { ...INITIAL_PROCESS_MAP_PANEL_FORM },
    }));
    await Promise.all([
      this.loadNextBatchPreview(productId),
      this.loadProcessMaps(productId),
    ]);
  };

  private openCreateProcessMap = () => {
    this.setState({
      processMapPanel: 'create',
      processMapPanelForm: { ...INITIAL_PROCESS_MAP_PANEL_FORM },
    });
  };

  private openEditProcessMap = () => {
    const { form, processMaps } = this.state;
    const pm = processMaps.find(p => p.id === form.processMapId);
    if (!pm) return;
    this.setState({
      processMapPanel: 'edit',
      processMapPanelForm: {
        name: pm.name,
        parameters: pm.parameters.map(p => ({ name: p.name, value: p.value, unit: p.unit })),
      },
    });
  };

  private closeProcessMapPanel = () => {
    this.setState({
      processMapPanel: 'none',
      processMapPanelForm: { ...INITIAL_PROCESS_MAP_PANEL_FORM },
    });
  };

  private saveProcessMap = async () => {
    const { form, processMapPanel, processMapPanelForm } = this.state;
    if (!processMapPanelForm.name.trim()) {
      this.setState({ error: 'Process map name is required.' });
      return;
    }
    this.setState({ processMapSaving: true, error: null });
    try {
      let saved: ProcessMapData;
      if (processMapPanel === 'create') {
        const data = await this.gql(CREATE_PROCESS_MAP_MUTATION, {
          input: {
            productId: form.productId,
            name: processMapPanelForm.name.trim(),
            parameters: processMapPanelForm.parameters.map(p => ({
              name: p.name.trim(),
              value: p.value.trim(),
              unit: p.unit.trim(),
            })),
          },
        });
        saved = data.createProcessMap as ProcessMapData;
        this.setState((prev) => ({
          processMaps: [...prev.processMaps, saved].sort((a, b) => a.name.localeCompare(b.name)),
          form: { ...prev.form, processMapId: saved.id },
          processMapPanel: 'none',
          processMapPanelForm: { ...INITIAL_PROCESS_MAP_PANEL_FORM },
          processMapSaving: false,
          notice: 'Process map created.',
        }));
      } else {
        const data = await this.gql(UPDATE_PROCESS_MAP_MUTATION, {
          id: form.processMapId,
          input: {
            name: processMapPanelForm.name.trim(),
            parameters: processMapPanelForm.parameters.map(p => ({
              name: p.name.trim(),
              value: p.value.trim(),
              unit: p.unit.trim(),
            })),
          },
        });
        saved = data.updateProcessMap as ProcessMapData;
        this.setState((prev) => ({
          processMaps: prev.processMaps.map(pm => pm.id === saved.id ? saved : pm),
          processMapPanel: 'none',
          processMapPanelForm: { ...INITIAL_PROCESS_MAP_PANEL_FORM },
          processMapSaving: false,
          notice: 'Process map updated.',
        }));
      }
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
    }));
  };

  private removeParameter = (idx: number) => {
    this.setState((prev) => ({
      processMapPanelForm: {
        ...prev.processMapPanelForm,
        parameters: prev.processMapPanelForm.parameters.filter((_, i) => i !== idx),
      },
    }));
  };

  private updateParameter = (idx: number, field: 'name' | 'value' | 'unit', val: string) => {
    this.setState((prev) => {
      const parameters = prev.processMapPanelForm.parameters.map((p, i) =>
        i === idx ? { ...p, [field]: val } : p
      );
      return { processMapPanelForm: { ...prev.processMapPanelForm, parameters } };
    });
  };

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
      processMapPanel,
      processMapPanelForm,
      processMapSaving,
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
                      this.setState({ form: { ...form, nettoWeight: event.target.value } })
                    }
                    required
                  />
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
                          processMapPanel: 'none',
                          processMapPanelForm: { ...INITIAL_PROCESS_MAP_PANEL_FORM },
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
                    {form.processMapId && processMapPanel !== 'edit' && (
                      <button
                        type="button"
                        className="cj-btn-sm"
                        onClick={this.openEditProcessMap}
                      >
                        Edit
                      </button>
                    )}
                    {processMapPanel !== 'create' && (
                      <button
                        type="button"
                        className="cj-btn-sm"
                        onClick={this.openCreateProcessMap}
                      >
                        + New
                      </button>
                    )}
                  </div>
                  {processMapPanel !== 'none' && (
                    <div className="material-form" style={{ marginTop: '12px', padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }}>
                      <h4 style={{ margin: '0 0 8px' }}>
                        {processMapPanel === 'create' ? 'New process map' : 'Edit process map'}
                      </h4>
                      <label className="cj-label">
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
                            <button
                              type="button"
                              className="cj-btn-sm"
                              onClick={() => this.removeParameter(idx)}
                            >
                              ×
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
                      <div className="material-actions" style={{ marginTop: '12px' }}>
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={processMapSaving}
                          onClick={() => void this.saveProcessMap()}
                        >
                          {processMapSaving ? 'Saving...' : 'Save process map'}
                        </button>
                        <button
                          type="button"
                          className="btn-outline"
                          onClick={this.closeProcessMapPanel}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                      <td>{new Date(batch.createdAt).toLocaleString(["sr"], { dateStyle: 'short', timeStyle: 'short' })}</td>
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