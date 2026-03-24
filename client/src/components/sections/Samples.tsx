import { type ChangeEvent } from 'react';
import Proto from '../../proto';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/graphql`;

const SAMPLE_FIELDS = `
  id
  number
  numberStr
  studyAt
  result
  note
  createdAt
  updatedAt
  batch {
    id
    numberStr
    product {
      id
      name
    }
  }
`;

const SEARCH_SAMPLES_QUERY = `
  query($input: SearchSamplesInput!) {
    searchSamples(input: $input) {
      ${SAMPLE_FIELDS}
    }
  }
`;

const UPDATE_SAMPLE_MUTATION = `
  mutation($id: ID!, $input: UpdateSampleInput!) {
    updateSample(id: $id, input: $input) {
      ${SAMPLE_FIELDS}
    }
  }
`;

interface SampleData {
  id: string;
  number: number;
  numberStr: string;
  studyAt: string | null;
  result: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  batch: {
    id: string;
    numberStr: string;
    product: {
      id: string;
      name: string;
    };
  };
}

interface SearchForm {
  fromDate: string;
  toDate: string;
  sampleNumber: string;
}

interface EditingData {
  sampleId: string;
  result: string;
  note: string;
  studyAt: string;
}

interface SamplesState {
  samples: SampleData[];
  loading: boolean;
  searching: boolean;
  updating: boolean;
  error: string | null;
  notice: string | null;
  searchForm: SearchForm;
  editingSample: EditingData | null;
}

const INITIAL_SEARCH_FORM: SearchForm = {
  fromDate: '',
  toDate: '',
  sampleNumber: '',
};

class Samples extends Proto<Record<string, never>, SamplesState> {
  state: SamplesState = {
    samples: [],
    loading: false,
    searching: false,
    updating: false,
    error: null,
    notice: null,
    searchForm: { ...INITIAL_SEARCH_FORM },
    editingSample: null,
  };

  componentDidMount() {
    void this.fetchSamples();
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

  private fetchSamples = async () => {
    this.setState({ loading: true, error: null, notice: null });

    try {
      const { searchForm } = this.state;

      const input: Record<string, unknown> = {};

      if (searchForm.fromDate) {
        input.fromDate = searchForm.fromDate;
      }

      if (searchForm.toDate) {
        input.toDate = searchForm.toDate;
      }

      if (searchForm.sampleNumber && searchForm.sampleNumber.trim()) {
        input.sampleNumber = Number.parseInt(searchForm.sampleNumber, 10);
      }

      const data = await this.gql(SEARCH_SAMPLES_QUERY, { input });

      this.setState({
        loading: false,
        samples: data.searchSamples as SampleData[],
      });
    } catch (error) {
      this.setState({ loading: false, error: String(error) });
    }
  };

  private handleSearchChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;
    this.setState({
      searchForm: { ...this.state.searchForm, [name]: value },
    });
  };

  private handleSearch = () => {
    void this.fetchSamples();
  };

  private handleReset = () => {
    this.setState({
      searchForm: { ...INITIAL_SEARCH_FORM },
      samples: [],
      error: null,
      notice: null,
    });
  };

  private handleEditClick = (sample: SampleData) => {
    this.setState({
      editingSample: {
        sampleId: sample.id,
        result: sample.result || '',
        note: sample.note || '',
        studyAt: sample.studyAt || '',
      },
    });
  };

  private handleEditChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const { editingSample } = this.state;

    if (!editingSample) return;

    this.setState({
      editingSample: { ...editingSample, [name]: value },
    });
  };

  private handleSaveEdit = async () => {
    const { editingSample } = this.state;

    if (!editingSample) return;

    this.setState({ updating: true, error: null, notice: null });

    try {
      const input: Record<string, unknown> = {};

      if (editingSample.result) {
        input.result = editingSample.result;
      }

      if (editingSample.note) {
        input.note = editingSample.note;
      }

      if (editingSample.studyAt) {
        input.studyAt = editingSample.studyAt;
      }

      await this.gql(UPDATE_SAMPLE_MUTATION, {
        id: editingSample.sampleId,
        input,
      });

      this.setState({
        updating: false,
        editingSample: null,
        notice: 'Sample updated successfully',
      });

      await this.fetchSamples();
    } catch (error) {
      this.setState({ updating: false, error: String(error) });
    }
  };

  private handleCancelEdit = () => {
    this.setState({ editingSample: null });
  };

  render() {
    const {
      samples,
      loading,
      searching,
      updating,
      error,
      notice,
      searchForm,
      editingSample,
    } = this.state;

    return (
      <section className="section tool-page">
        <div className="section-inner tool-page-inner">
          <p className="section-label">Staff</p>
          <h1 className="section-title">Samples</h1>

          {error && <div className="notice error">{error}</div>}
          {notice && <div className="notice success">{notice}</div>}

          <div className="search-container batch-form">
            <h2>Search Samples</h2>

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
                Sample Number
                <input
                  className="cj-input material-input"
                  type="number"
                  name="sampleNumber"
                  placeholder="e.g., 1"
                  value={searchForm.sampleNumber}
                  onChange={this.handleSearchChange}
                />
              </label>
            </div>

            <div className="form-actions">
              <button
                className="btn btn-primary"
                onClick={this.handleSearch}
                disabled={searching || loading}
              >
                {searching || loading ? 'Searching...' : 'Search'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={this.handleReset}
                disabled={searching || loading}
              >
                Reset
              </button>
            </div>
          </div>

          {editingSample ? (
            <div className="sample-edit-form batch-form">
              <h2>Edit Sample {editingSample.sampleId}</h2>

              <label className="cj-label">
                Result
                <select
                  className="cj-select batch-select"
                  name="result"
                  value={editingSample.result}
                  onChange={this.handleEditChange}
                >
                  <option value="">-- Select Result --</option>
                  <option value="Ok">Ok</option>
                  <option value="NotOk">Not Ok</option>
                </select>
              </label>

              <label className="cj-label">
                Study Date
                <input
                  className="cj-input material-input"
                  type="date"
                  name="studyAt"
                  value={editingSample.studyAt}
                  onChange={this.handleEditChange}
                />
              </label>

              <label className="cj-label">
                Note
                <textarea
                  className="cj-input material-input"
                  name="note"
                  placeholder="Enter sample note..."
                  value={editingSample.note}
                  onChange={this.handleEditChange}
                  rows={4}
                />
              </label>

              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  onClick={this.handleSaveEdit}
                  disabled={updating}
                >
                  {updating ? 'Saving...' : 'Save'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={this.handleCancelEdit}
                  disabled={updating}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {samples.length > 0 && (
            <div className="samples-list">
              <h2>Results ({samples.length})</h2>
              <table className="samples-table">
                <thead>
                  <tr>
                    <th>Sample #</th>
                    <th>Batch</th>
                    <th>Product</th>
                    <th>Result</th>
                    <th>Note</th>
                    <th>Study Date</th>
                    <th>Created At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {samples.map((sample) => (
                    <tr key={sample.id}>
                      <td>{sample.numberStr}</td>
                      <td>{sample.batch.numberStr}</td>
                      <td>{sample.batch.product.name}</td>
                      <td>{sample.result || '-'}</td>
                      <td>{sample.note ? sample.note.substring(0, 50) + (sample.note.length > 50 ? '...' : '') : '-'}</td>
                      <td>
                        {sample.studyAt
                          ? new Date(sample.studyAt).toLocaleDateString()
                          : '-'}
                      </td>
                      <td>
                        {new Date(sample.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <button
                          className="btn btn-small"
                          onClick={() => this.handleEditClick(sample)}
                          disabled={updating}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && samples.length === 0 && Object.values(searchForm).some(v => v) && (
            <div className="no-results">
              <p>No samples found matching your search criteria.</p>
            </div>
          )}
        </div>
      </section>
    );
  }
}

export default Samples;
