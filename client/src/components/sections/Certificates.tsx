import { type ChangeEvent } from 'react';
import Proto from '../../proto';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/graphql`;
const REST_API_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const CERTIFICATE_FIELDS = `
  id
  number
  numberYear
  numberStr
  extraCertificateData
  createdAt
  updatedAt
  batch {
    id
    number
    numberStr
    createdAt
    nettoWeight
    storageDurationHours
    processDeviations
    product {
      id
      name
    }
    storageCondition {
      id
      name
    }
    processMap {
      id
      name
    }
    samples {
      id
      numberStr
      result
      studyAt
    }
  }
`;

const INITIAL_QUERY = `
  query {
    certificateBatchOptions {
      id
      number
      numberStr
      createdAt
      product {
        id
        name
      }
    }
    products {
      id
      name
    }
    certificates {
      ${CERTIFICATE_FIELDS}
    }
  }
`;

const SEARCH_CERTIFICATES_QUERY = `
  query($input: SearchCertificatesInput!) {
    searchCertificates(input: $input) {
      ${CERTIFICATE_FIELDS}
    }
  }
`;

const CREATE_CERTIFICATE_MUTATION = `
  mutation($input: CreateCertificateInput!) {
    createCertificate(input: $input) {
      id
      numberStr
    }
  }
`;

const UPDATE_CERTIFICATE_MUTATION = `
  mutation($id: ID!, $input: UpdateCertificateInput!) {
    updateCertificate(id: $id, input: $input) {
      id
      extraCertificateData
      updatedAt
    }
  }
`;

interface ProductOption {
  id: string;
  name: string;
}

interface CertificateBatchOption {
  id: string;
  number: number;
  numberStr: string;
  createdAt: string;
  product: ProductOption;
}

interface CertificateData {
  id: string;
  number: number;
  numberYear: number;
  numberStr: string;
  extraCertificateData: string;
  createdAt: string;
  updatedAt: string;
  batch: {
    id: string;
    number: number;
    numberStr: string;
    createdAt: string;
    nettoWeight: number;
    storageDurationHours: number;
    processDeviations: string | null;
    product: ProductOption;
    storageCondition: {
      id: string;
      name: string;
    };
    processMap: {
      id: string;
      name: string;
    } | null;
    samples: Array<{
      id: string;
      numberStr: string;
      result: string | null;
      studyAt: string | null;
    }>;
  };
}

interface SearchForm {
  fromDate: string;
  toDate: string;
  number: string;
  productId: string;
  batchNumber: string;
}

interface CreateForm {
  batchId: string;
  extraCertificateData: string;
}

interface EditForm {
  id: string;
  numberStr: string;
  extraCertificateData: string;
}

interface CertificatesState {
  certificates: CertificateData[];
  availableBatches: CertificateBatchOption[];
  products: ProductOption[];
  searchForm: SearchForm;
  createForm: CreateForm;
  editing: EditForm | null;
  loading: boolean;
  searching: boolean;
  saving: boolean;
  generatingId: string | null;
  error: string | null;
  notice: string | null;
}

const INITIAL_SEARCH_FORM: SearchForm = {
  fromDate: '',
  toDate: '',
  number: '',
  productId: '',
  batchNumber: '',
};

const INITIAL_CREATE_FORM: CreateForm = {
  batchId: '',
  extraCertificateData: '',
};

class Certificates extends Proto<Record<string, never>, CertificatesState> {
  state: CertificatesState = {
    certificates: [],
    availableBatches: [],
    products: [],
    searchForm: { ...INITIAL_SEARCH_FORM },
    createForm: { ...INITIAL_CREATE_FORM },
    editing: null,
    loading: false,
    searching: false,
    saving: false,
    generatingId: null,
    error: null,
    notice: null,
  };

  componentDidMount() {
    void this.fetchInitialData();
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

  private fetchInitialData = async () => {
    this.setState({ loading: true, error: null, notice: null });

    try {
      const data = await this.gql(INITIAL_QUERY);

      this.setState({
        loading: false,
        availableBatches: data.certificateBatchOptions as CertificateBatchOption[],
        products: data.products as ProductOption[],
        certificates: data.certificates as CertificateData[],
      });
    } catch (error) {
      this.setState({ loading: false, error: String(error) });
    }
  };

  private handleCreateChange = (
    event: ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    this.setState({
      createForm: { ...this.state.createForm, [name]: value },
    });
  };

  private handleSearchChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    this.setState({
      searchForm: { ...this.state.searchForm, [name]: value },
    });
  };

  private handleEditChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const { editing } = this.state;
    if (!editing) return;

    this.setState({
      editing: {
        ...editing,
        extraCertificateData: event.target.value,
      },
    });
  };

  private createCertificate = async () => {
    const { createForm } = this.state;

    if (!createForm.batchId) {
      this.setState({ error: 'Choose a batch to create certificate.' });
      return;
    }

    this.setState({ saving: true, error: null, notice: null });

    try {
      const data = await this.gql(CREATE_CERTIFICATE_MUTATION, {
        input: {
          batchId: createForm.batchId,
          extraCertificateData: createForm.extraCertificateData.trim() || null,
        },
      });

      await this.fetchInitialData();

      this.setState({
        saving: false,
        createForm: { ...INITIAL_CREATE_FORM },
        notice: `Certificate ${(data.createCertificate as { numberStr: string }).numberStr} created.`,
      });
    } catch (error) {
      this.setState({ saving: false, error: String(error) });
    }
  };

  private searchCertificates = async () => {
    const { searchForm } = this.state;

    this.setState({ searching: true, error: null, notice: null });

    try {
      const input: Record<string, unknown> = {};

      if (searchForm.fromDate) {
        input.fromDate = searchForm.fromDate;
      }
      if (searchForm.toDate) {
        input.toDate = searchForm.toDate;
      }
      if (searchForm.productId) {
        input.productId = searchForm.productId;
      }
      if (searchForm.batchNumber.trim()) {
        input.batchNumber = searchForm.batchNumber.trim();
      }
      if (searchForm.number.trim()) {
        input.number = Number.parseInt(searchForm.number, 10);
      }

      const data = await this.gql(SEARCH_CERTIFICATES_QUERY, { input });

      this.setState({
        searching: false,
        certificates: data.searchCertificates as CertificateData[],
      });
    } catch (error) {
      this.setState({ searching: false, error: String(error) });
    }
  };

  private resetSearch = async () => {
    this.setState({
      searchForm: { ...INITIAL_SEARCH_FORM },
      error: null,
      notice: null,
    });
    await this.fetchInitialData();
  };

  private openEdit = (certificate: CertificateData) => {
    this.setState({
      editing: {
        id: certificate.id,
        numberStr: certificate.numberStr,
        extraCertificateData: certificate.extraCertificateData || '',
      },
      notice: null,
      error: null,
    });
  };

  private cancelEdit = () => {
    this.setState({ editing: null });
  };

  private saveEdit = async () => {
    const { editing } = this.state;
    if (!editing) return;

    this.setState({ saving: true, error: null, notice: null });

    try {
      await this.gql(UPDATE_CERTIFICATE_MUTATION, {
        id: editing.id,
        input: {
          extraCertificateData: editing.extraCertificateData,
        },
      });

      await this.searchCertificates();

      this.setState({
        saving: false,
        editing: null,
        notice: `Certificate ${editing.numberStr} updated.`,
      });
    } catch (error) {
      this.setState({ saving: false, error: String(error) });
    }
  };

  private generateDocument = async (certificate: CertificateData) => {
    const certificateId = certificate.id;
    this.setState({ generatingId: certificateId, error: null, notice: null });

    try {
      const response = await fetch(
        `${REST_API_URL}/certificates/${encodeURIComponent(certificateId)}/document`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Failed to download document (${response.status})`);
      }

      const disposition = response.headers.get('content-disposition') ?? '';
      const fileNameStarMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      const fileNameClassicMatch = disposition.match(/filename="?([^";]+)"?/i);
      const safeBatchNumber = certificate.batch.numberStr
        .replace(/[\\/:*?"<>|]+/g, '-')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      const fallbackFileName = `cert-${safeBatchNumber || 'unknown-batch'}.docx`;
      const fileName = fileNameStarMatch?.[1]
        ? decodeURIComponent(fileNameStarMatch[1])
        : fileNameClassicMatch?.[1] ?? fallbackFileName;
      const mimeType =
        response.headers.get('content-type') ??
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const arrayBuffer = await response.arrayBuffer();
      const signature = new Uint8Array(arrayBuffer.slice(0, 2));
      if (signature.length < 2 || signature[0] !== 0x50 || signature[1] !== 0x4b) {
        const asText = new TextDecoder().decode(arrayBuffer);
        throw new Error(`Downloaded file is not a valid Word document: ${asText}`);
      }

      const blob = new Blob([arrayBuffer], { type: mimeType });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      this.setState({
        generatingId: null,
        notice: `Certificate document ${fileName} generated.`,
      });
    } catch (error) {
      this.setState({ generatingId: null, error: String(error) });
    }
  };

  render() {
    const {
      certificates,
      availableBatches,
      products,
      searchForm,
      createForm,
      editing,
      loading,
      searching,
      saving,
      generatingId,
      error,
      notice,
    } = this.state;

    return (
      <section className="section tool-page">
        <div className="section-inner tool-page-inner">
          <p className="section-label">Staff</p>
          <h1 className="section-title">Certificates</h1>

          {error && <div className="notice error">{error}</div>}
          {notice && <div className="notice success">{notice}</div>}

          <div className="batch-form">
            <h2>Create Certificate</h2>
            <div className="form-group">
              <label className="cj-label">
                Batch
                <select
                  className="cj-select batch-select"
                  name="batchId"
                  value={createForm.batchId}
                  onChange={this.handleCreateChange}
                  disabled={saving || loading}
                >
                  <option value="">-- Select Batch --</option>
                  {availableBatches.map(batch => (
                    <option key={batch.id} value={batch.id}>
                      {batch.numberStr} - {batch.product.name} ({this.toLocalDate(batch.createdAt)})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="cj-label">
              Extra Certificate Data
              <textarea
                className="cj-input material-input"
                name="extraCertificateData"
                rows={5}
                placeholder="Enter extra certificate text"
                value={createForm.extraCertificateData}
                onChange={this.handleCreateChange}
                disabled={saving || loading}
              />
            </label>

            <div className="form-actions">
              <button className="btn btn-primary" onClick={this.createCertificate} disabled={saving || loading}>
                {saving ? 'Creating...' : 'Create Certificate'}
              </button>
            </div>
          </div>

          <div className="batch-form search-container">
            <h2>Find Certificates</h2>
            <div className="form-group">
              <label className="cj-label">
                From Date
                <input
                  className="cj-input material-input"
                  type="date"
                  name="fromDate"
                  value={searchForm.fromDate}
                  onChange={this.handleSearchChange}
                />
              </label>

              <label className="cj-label">
                To Date
                <input
                  className="cj-input material-input"
                  type="date"
                  name="toDate"
                  value={searchForm.toDate}
                  onChange={this.handleSearchChange}
                />
              </label>

              <label className="cj-label">
                Certificate Number
                <input
                  className="cj-input material-input"
                  type="number"
                  name="number"
                  placeholder="e.g. 1"
                  value={searchForm.number}
                  onChange={this.handleSearchChange}
                />
              </label>

              <label className="cj-label">
                Product
                <select
                  className="cj-select batch-select"
                  name="productId"
                  value={searchForm.productId}
                  onChange={this.handleSearchChange}
                >
                  <option value="">All products</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="cj-label">
                Batch Number
                <input
                  className="cj-input material-input"
                  type="text"
                  name="batchNumber"
                  placeholder="e.g. 26/BRD/3 or 3"
                  value={searchForm.batchNumber}
                  onChange={this.handleSearchChange}
                />
              </label>
            </div>

            <div className="form-actions">
              <button
                className="btn btn-primary"
                onClick={this.searchCertificates}
                disabled={loading || searching}
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  void this.resetSearch();
                }}
                disabled={loading || searching}
              >
                Reset
              </button>
            </div>
          </div>

          {editing ? (
            <div className="batch-form sample-edit-form">
              <h2>Edit Certificate {editing.numberStr}</h2>
              <label className="cj-label">
                Extra Certificate Data
                <textarea
                  className="cj-input material-input"
                  rows={6}
                  value={editing.extraCertificateData}
                  onChange={this.handleEditChange}
                  disabled={saving}
                />
              </label>

              <div className="form-actions">
                <button className="btn btn-primary" onClick={this.saveEdit} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button className="btn btn-secondary" onClick={this.cancelEdit} disabled={saving}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          <div className="samples-list">
            <h2>Certificates ({certificates.length})</h2>
            <table className="samples-table">
              <thead>
                <tr>
                  <th>Certificate #</th>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Batch</th>
                  <th>Storage Condition</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map(certificate => (
                  <tr key={certificate.id}>
                    <td>{certificate.numberStr}</td>
                    <td>{this.toLocalDate(certificate.createdAt)}</td>
                    <td>{certificate.batch.product.name}</td>
                    <td>{certificate.batch.numberStr}</td>
                    <td>{certificate.batch.storageCondition.name}</td>
                    <td className="certificate-actions-cell">
                      <button
                        className="btn btn-small"
                        onClick={() => this.openEdit(certificate)}
                        disabled={saving || generatingId === certificate.id}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-small btn-primary"
                        onClick={() => {
                          void this.generateDocument(certificate);
                        }}
                        disabled={saving || generatingId === certificate.id}
                      >
                        {generatingId === certificate.id ? 'Generating...' : 'Download Word'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loading && certificates.length === 0 ? (
              <div className="no-results">
                <p>No certificates found.</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    );
  }
}

export default Certificates;
