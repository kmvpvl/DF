import Proto from '../../proto';
import { type User } from '../../App';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/graphql`;

const EQUIPMENTS_QUERY = `query { equipments { id numId fullName } }`;
const USERS_QUERY = `query { users { id name fullName } }`;
const CLEAN_ACTIONS_QUERY = `
  query CleanActions($cleaningType: CleaningType, $fromDate: String, $toDate: String) {
    cleanActions(cleaningType: $cleaningType, fromDate: $fromDate, toDate: $toDate) {
      id
      equipment { id numId fullName }
      performer { id name }
      supervisor { id name }
      cleaningType
      createdAt
    }
  }
`;
const CREATE_EQUIPMENT_MUTATION = `
  mutation($input: CreateEquipmentInput!) {
    createEquipment(input: $input) { id numId fullName }
  }
`;
const UPDATE_EQUIPMENT_MUTATION = `
  mutation($id: ID!, $input: UpdateEquipmentInput!) {
    updateEquipment(id: $id, input: $input) { id numId fullName }
  }
`;
const DELETE_EQUIPMENT_MUTATION = `mutation($id: ID!) { deleteEquipment(id: $id) }`;
const CREATE_CLEAN_ACTION_MUTATION = `
  mutation($input: CreateCleanActionInput!) {
    createCleanAction(input: $input) {
      id
      equipment { id numId fullName }
      performer { id name }
      supervisor { id name }
      cleaningType
      createdAt
    }
  }
`;

interface EquipmentData {
  id: string;
  numId: number;
  fullName: string;
}

interface UserData {
  id: string;
  name: string;
  fullName: string;
}

interface CleanActionData {
  id: string;
  equipment: { id: string; numId: number; fullName: string };
  performer: { id: string; name: string };
  supervisor: { id: string; name: string };
  cleaningType: 'GENERAL' | 'CURRENT' | 'DISINFECTION';
  createdAt: string;
}

interface CleaningJournalProps {
  user: User | null;
}

interface CleaningJournalState {
  subTab: 'action' | 'report' | 'equipment';

  equipments: EquipmentData[];
  equipmentsLoading: boolean;
  equipmentError: string | null;
  editingEquipment: EquipmentData | null;
  addingEquipment: boolean;
  equipmentForm: { numId: string; fullName: string };
  equipmentSaving: boolean;

  users: UserData[];
  usersLoading: boolean;

  actionForm: {
    equipmentId: string;
    performerId: string;
    supervisorId: string;
    cleaningType: 'GENERAL' | 'CURRENT' | 'DISINFECTION';
  };
  actionSaving: boolean;
  actionSuccess: boolean;
  actionError: string | null;

  reportFrom: string;
  reportTo: string;
  reportType: '' | 'GENERAL' | 'CURRENT' | 'DISINFECTION';
  reportActions: CleanActionData[];
  reportLoading: boolean;
  reportError: string | null;
  reportQueried: boolean;
}

const CLEANING_TYPE_LABELS: Record<string, string> = {
  GENERAL: 'General',
  CURRENT: 'Current',
  DISINFECTION: 'Disinfection',
};

class CleaningJournal extends Proto<CleaningJournalProps, CleaningJournalState> {
  state: CleaningJournalState = {
    subTab: 'action',

    equipments: [],
    equipmentsLoading: false,
    equipmentError: null,
    editingEquipment: null,
    addingEquipment: false,
    equipmentForm: { numId: '', fullName: '' },
    equipmentSaving: false,

    users: [],
    usersLoading: false,

    actionForm: {
      equipmentId: '',
      performerId: '',
      supervisorId: '',
      cleaningType: 'CURRENT',
    },
    actionSaving: false,
    actionSuccess: false,
    actionError: null,

    reportFrom: '',
    reportTo: '',
    reportType: '',
    reportActions: [],
    reportLoading: false,
    reportError: null,
    reportQueried: false,
  };

  componentDidMount() {
    void this.fetchEquipments();
    void this.fetchUsers();
    this.applyLoggedInUserDefaults();
  }

  componentDidUpdate(prevProps: CleaningJournalProps) {
    if (prevProps.user?.id !== this.props.user?.id) {
      this.applyLoggedInUserDefaults();
    }
  }

  private applyLoggedInUserDefaults = () => {
    const loggedInUserId = this.props.user?.id;
    if (!loggedInUserId) {
      return;
    }

    this.setState(prev => {
      const shouldSetPerformer = !prev.actionForm.performerId;
      const shouldSetSupervisor = !prev.actionForm.supervisorId;

      if (!shouldSetPerformer && !shouldSetSupervisor) {
        return null;
      }

      return {
        actionForm: {
          ...prev.actionForm,
          performerId: shouldSetPerformer
            ? loggedInUserId
            : prev.actionForm.performerId,
          supervisorId: shouldSetSupervisor
            ? loggedInUserId
            : prev.actionForm.supervisorId,
        },
      };
    });
  };

  private gql = async (query: string, variables: Record<string, unknown> = {}) => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ query, variables }),
    });
    const json = (await response.json()) as { data?: unknown; errors?: { message: string }[] };
    if (json.errors?.length) throw new Error(json.errors[0].message);
    return json.data as Record<string, unknown>;
  };

  private fetchEquipments = async () => {
    this.setState({ equipmentsLoading: true, equipmentError: null });
    try {
      const data = await this.gql(EQUIPMENTS_QUERY);
      this.setState({ equipments: data.equipments as EquipmentData[], equipmentsLoading: false });
    } catch (e) {
      this.setState({ equipmentError: String(e), equipmentsLoading: false });
    }
  };

  private fetchUsers = async () => {
    this.setState({ usersLoading: true });
    try {
      const data = await this.gql(USERS_QUERY);
      this.setState(
        { users: data.users as UserData[], usersLoading: false },
        this.applyLoggedInUserDefaults
      );
    } catch {
      this.setState({ usersLoading: false });
    }
  };

  private saveEquipment = async () => {
    const { equipmentForm, editingEquipment } = this.state;
    const numId = parseInt(equipmentForm.numId, 10);
    if (!Number.isFinite(numId) || !equipmentForm.fullName.trim()) return;
    this.setState({ equipmentSaving: true, equipmentError: null });
    try {
      if (editingEquipment) {
        const data = await this.gql(UPDATE_EQUIPMENT_MUTATION, {
          id: editingEquipment.id,
          input: { numId, fullName: equipmentForm.fullName.trim() },
        });
        const updated = data.updateEquipment as EquipmentData;
        this.setState(prev => ({
          equipments: prev.equipments.map(e => (e.id === updated.id ? updated : e)),
          editingEquipment: null,
          addingEquipment: false,
          equipmentForm: { numId: '', fullName: '' },
          equipmentSaving: false,
        }));
      } else {
        const data = await this.gql(CREATE_EQUIPMENT_MUTATION, {
          input: { numId, fullName: equipmentForm.fullName.trim() },
        });
        const created = data.createEquipment as EquipmentData;
        this.setState(prev => ({
          equipments: [...prev.equipments, created].sort((a, b) => a.numId - b.numId),
          addingEquipment: false,
          equipmentForm: { numId: '', fullName: '' },
          equipmentSaving: false,
        }));
      }
    } catch (e) {
      this.setState({ equipmentError: String(e), equipmentSaving: false });
    }
  };

  private deleteEquipment = async (id: string) => {
    if (!confirm('Delete this equipment? This cannot be undone.')) return;
    try {
      await this.gql(DELETE_EQUIPMENT_MUTATION, { id });
      this.setState(prev => ({ equipments: prev.equipments.filter(e => e.id !== id) }));
    } catch (e) {
      this.setState({ equipmentError: String(e) });
    }
  };

  private submitAction = async () => {
    const { actionForm } = this.state;
    if (!actionForm.equipmentId || !actionForm.performerId || !actionForm.supervisorId) return;
    this.setState({ actionSaving: true, actionError: null, actionSuccess: false });
    try {
      await this.gql(CREATE_CLEAN_ACTION_MUTATION, { input: actionForm });
      this.setState({
        actionSaving: false,
        actionSuccess: true,
        actionForm: { equipmentId: '', performerId: '', supervisorId: '', cleaningType: 'CURRENT' },
      });
    } catch (e) {
      this.setState({ actionError: String(e), actionSaving: false });
    }
  };

  private runReport = async () => {
    const { reportFrom, reportTo, reportType } = this.state;
    this.setState({ reportLoading: true, reportError: null, reportQueried: true });
    try {
      const data = await this.gql(CLEAN_ACTIONS_QUERY, {
        cleaningType: reportType || undefined,
        fromDate: reportFrom || undefined,
        toDate: reportTo || undefined,
      });
      this.setState({ reportActions: data.cleanActions as CleanActionData[], reportLoading: false });
    } catch (e) {
      this.setState({ reportError: String(e), reportLoading: false });
    }
  };

  private exportCsv = () => {
    const { reportActions, reportFrom, reportTo, reportType } = this.state;
    const headers = ['Date', 'Equipment #', 'Equipment', 'Type', 'Performer', 'Supervisor'];
    const rows = reportActions.map(a => [
      new Date(a.createdAt).toLocaleString(["sr"], { dateStyle: 'short', timeStyle: 'short' }),
      String(a.equipment.numId),
      a.equipment.fullName,
      CLEANING_TYPE_LABELS[a.cleaningType] ?? a.cleaningType,
      a.performer.name,
      a.supervisor.name,
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    const suffix = [reportType, reportFrom, reportTo].filter(Boolean).join('_') || 'all';
    anchor.download = `cleaning-report-${suffix}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  private cancelEquipmentForm = () => {
    this.setState({
      addingEquipment: false,
      editingEquipment: null,
      equipmentForm: { numId: '', fullName: '' },
    });
  };

  render() {
    const {
      subTab,
      equipments, equipmentsLoading, equipmentError, editingEquipment, addingEquipment,
      equipmentForm, equipmentSaving,
      users,
      actionForm, actionSaving, actionSuccess, actionError,
      reportFrom, reportTo, reportType, reportActions, reportLoading, reportError, reportQueried,
    } = this.state;

    return (
      <div className="cleaning-journal">
        <div className="cj-header">
          <p className="section-label">Cleaning Journal</p>
          <h1 className="section-title cj-title">Cleaning</h1>
        </div>

        <div className="cj-sub-tabs">
          {(['action', 'report', 'equipment'] as const).map(tab => (
            <button
              key={tab}
              className={`cj-sub-tab${subTab === tab ? ' active' : ''}`}
              onClick={() => this.setState({ subTab: tab })}
            >
              {tab === 'action' ? 'New Action' : tab === 'report' ? 'Report' : 'Equipment'}
            </button>
          ))}
        </div>

        {/* ── Equipment tab ─────────────────────────── */}
        {subTab === 'equipment' && (
          <div className="cj-panel">
            <div className="cj-panel-header">
              <h2 className="cj-panel-title">Equipment list</h2>
              {!addingEquipment && !editingEquipment && (
                <button
                  className="btn-primary cj-add-btn"
                  onClick={() =>
                    this.setState({ addingEquipment: true, equipmentForm: { numId: '', fullName: '' } })
                  }
                >
                  + Add
                </button>
              )}
            </div>

            {equipmentError && <div className="cj-error">{equipmentError}</div>}

            {(addingEquipment || editingEquipment) && (
              <form
                className="cj-inline-form"
                onSubmit={e => {
                  e.preventDefault();
                  void this.saveEquipment();
                }}
              >
                <input
                  className="cj-input"
                  type="number"
                  placeholder="# (unique)"
                  value={equipmentForm.numId}
                  min={1}
                  onChange={e =>
                    this.setState({ equipmentForm: { ...equipmentForm, numId: e.target.value } })
                  }
                  required
                />
                <input
                  className="cj-input cj-input-wide"
                  type="text"
                  placeholder="Full name"
                  value={equipmentForm.fullName}
                  onChange={e =>
                    this.setState({ equipmentForm: { ...equipmentForm, fullName: e.target.value } })
                  }
                  required
                />
                <button type="submit" className="btn-primary" disabled={equipmentSaving}>
                  {equipmentSaving ? 'Saving…' : editingEquipment ? 'Update' : 'Save'}
                </button>
                <button type="button" className="btn-outline" onClick={this.cancelEquipmentForm}>
                  Cancel
                </button>
              </form>
            )}

            {equipmentsLoading ? (
              <p className="cj-loading">Loading…</p>
            ) : (
              <table className="cj-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {equipments.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="cj-empty">
                        No equipment added yet.
                      </td>
                    </tr>
                  ) : (
                    equipments.map(eq => (
                      <tr key={eq.id}>
                        <td className="cj-num-cell">{eq.numId}</td>
                        <td>{eq.fullName}</td>
                        <td className="cj-row-actions">
                          <button
                            className="cj-btn-sm"
                            onClick={() =>
                              this.setState({
                                editingEquipment: eq,
                                addingEquipment: false,
                                equipmentForm: { numId: String(eq.numId), fullName: eq.fullName },
                              })
                            }
                          >
                            Edit
                          </button>
                          <button
                            className="cj-btn-sm cj-btn-danger"
                            onClick={() => void this.deleteEquipment(eq.id)}
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
        )}

        {/* ── New Action tab ────────────────────────── */}
        {subTab === 'action' && (
          <div className="cj-panel">
            <h2 className="cj-panel-title">Log Cleaning Action</h2>

            {actionSuccess && (
              <div className="cj-success">Action logged successfully!</div>
            )}
            {actionError && <div className="cj-error">{actionError}</div>}

            <form
              className="cj-form"
              onSubmit={e => {
                e.preventDefault();
                void this.submitAction();
              }}
            >
              <label className="cj-label">
                Equipment
                <select
                  className="cj-select"
                  value={actionForm.equipmentId}
                  onChange={e =>
                    this.setState({ actionForm: { ...actionForm, equipmentId: e.target.value } })
                  }
                  required
                >
                  <option value="">— select —</option>
                  {equipments.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.numId} — {eq.fullName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="cj-label">
                Cleaning Type
                <select
                  className="cj-select"
                  value={actionForm.cleaningType}
                  onChange={e =>
                    this.setState({
                      actionForm: {
                        ...actionForm,
                        cleaningType: e.target.value as 'GENERAL' | 'CURRENT' | 'DISINFECTION',
                      },
                    })
                  }
                >
                  <option value="CURRENT">Current</option>
                  <option value="GENERAL">General</option>
                  <option value="DISINFECTION">Disinfection</option>
                </select>
              </label>

              <label className="cj-label">
                Performer
                <select
                  className="cj-select"
                  value={actionForm.performerId}
                  onChange={e =>
                    this.setState({ actionForm: { ...actionForm, performerId: e.target.value } })
                  }
                  required
                >
                  <option value="">— select —</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.fullName})
                    </option>
                  ))}
                </select>
              </label>

              <label className="cj-label">
                Supervisor
                <select
                  className="cj-select"
                  value={actionForm.supervisorId}
                  onChange={e =>
                    this.setState({ actionForm: { ...actionForm, supervisorId: e.target.value } })
                  }
                  required
                >
                  <option value="">— select —</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.fullName})
                    </option>
                  ))}
                </select>
              </label>

              <button type="submit" className="btn-primary cj-submit-btn" disabled={actionSaving}>
                {actionSaving ? 'Saving…' : 'Log Action'}
              </button>
            </form>
          </div>
        )}

        {/* ── Report tab ────────────────────────────── */}
        {subTab === 'report' && (
          <div className="cj-panel">
            <h2 className="cj-panel-title">Cleaning Report</h2>

            <div className="cj-report-filters">
              <label className="cj-label">
                From
                <input
                  type="date"
                  className="cj-input"
                  value={reportFrom}
                  onChange={e => this.setState({ reportFrom: e.target.value })}
                />
              </label>

              <label className="cj-label">
                To
                <input
                  type="date"
                  className="cj-input"
                  value={reportTo}
                  onChange={e => this.setState({ reportTo: e.target.value })}
                />
              </label>

              <label className="cj-label">
                Type
                <select
                  className="cj-select"
                  value={reportType}
                  onChange={e =>
                    this.setState({
                      reportType: e.target.value as '' | 'GENERAL' | 'CURRENT' | 'DISINFECTION',
                    })
                  }
                >
                  <option value="">All types</option>
                  <option value="CURRENT">Current</option>
                  <option value="GENERAL">General</option>
                  <option value="DISINFECTION">Disinfection</option>
                </select>
              </label>

              <button
                className="btn-primary cj-run-btn"
                onClick={() => void this.runReport()}
                disabled={reportLoading}
              >
                {reportLoading ? 'Loading…' : 'Run Report'}
              </button>

              {reportQueried && reportActions.length > 0 && (
                <button className="btn-outline" onClick={this.exportCsv}>
                  Export to Excel
                </button>
              )}
            </div>

            {reportError && <div className="cj-error">{reportError}</div>}

            {reportQueried && !reportLoading && (
              reportActions.length === 0 ? (
                <p className="cj-empty-report">No records found for the selected filters.</p>
              ) : (
                <table className="cj-table cj-report-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>#</th>
                      <th>Equipment</th>
                      <th>Type</th>
                      <th>Performer</th>
                      <th>Supervisor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportActions.map(a => (
                      <tr key={a.id}>
                        <td>{new Date(a.createdAt).toLocaleString(["sr"], { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td className="cj-num-cell">{a.equipment.numId}</td>
                        <td>{a.equipment.fullName}</td>
                        <td>
                          <span className={`cj-type-badge cj-type-${a.cleaningType.toLowerCase()}`}>
                            {CLEANING_TYPE_LABELS[a.cleaningType] ?? a.cleaningType}
                          </span>
                        </td>
                        <td>{a.performer.name}</td>
                        <td>{a.supervisor.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        )}
      </div>
    );
  }
}

export default CleaningJournal;
