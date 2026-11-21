import { type ChangeEvent, type FormEvent } from 'react';
import Proto, { IProtoProps, IProtoState } from '../../proto';
import { MLSTRING_FIELDS } from '../../types/gql';
import { type IMLString } from '../../mlstring';

const INITIAL_QUERY = `
  query($fromDate: String, $toDate: String) {
    movements(fromDate: $fromDate, toDate: $toDate) {
      id
      type
      quantity
      variantLabel
      createdAt
      locationId
      location { id name }
      product { id name ${MLSTRING_FIELDS} batchPrefix }
      batch { id numberStr }
      user { id name fullName }
    }
    products {
      id
      name ${MLSTRING_FIELDS}
      batchPrefix
      variants {
        id
        label ${MLSTRING_FIELDS}
      }
    }
  }
`;

const CREATE_MOVEMENT_MUTATION = `
  mutation($input: CreateMovementInput!) {
    createMovement(input: $input) {
      id
    }
  }
`;

interface MovementProduct {
  id: string;
  name: IMLString | string;
  variants: { id: string; label: IMLString | string }[];
}

interface MovementBatch {
  id: string;
  numberStr: string;
}

interface MovementRecord {
  id: string;
  type: string;
  quantity: number;
  variantLabel: string | null;
  createdAt: string;
  locationId: string;
  location: { id: string; name: string } | null;
  product: { id: string; name: IMLString | string; batchPrefix: string } | null;
  batch: MovementBatch | null;
  user: { id: string; name: string; fullName: string } | null;
}

interface StaffMovementsState extends IProtoState {
  loading: boolean;
  saving: boolean;
  error: string | null;
  notice: string | null;
  movements: MovementRecord[];
  products: MovementProduct[];
  type: string;
  productId: string;
  variantLabel: string;
  batchId: string;
  quantity: string;
  targetLocationId: string;
  label: string;
  typeFilter: string;
  fromDate: string;
  toDate: string;
}

const MOVEMENT_TYPES = [
  ['PURCHASE', 'Закупка / поступление'],
  ['PRODUCTION', 'Производство'],
  ['SALE', 'Продажа'],
  ['WRITE_OFF', 'Списание'],
  ['RETURN', 'Возврат'],
  ['MOVE_IN', 'Перемещение внутрь'],
  ['MOVE_OUT', 'Перемещение наружу'],
] as const;

function getLocalDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDefaultMovementDateRange(): { fromDate: string; toDate: string } {
  const today = new Date();
  const firstDay = new Date(today);
  firstDay.setDate(firstDay.getDate() - 6);
  return {
    fromDate: getLocalDateInputValue(firstDay),
    toDate: getLocalDateInputValue(today),
  };
}

class StaffMovements extends Proto<IProtoProps, StaffMovementsState> {
  private defaultDateRange = getDefaultMovementDateRange();

  state: StaffMovementsState = {
    loading: true,
    saving: false,
    error: null,
    notice: null,
    movements: [],
    products: [],
    type: 'PURCHASE',
    productId: '',
    variantLabel: '',
    batchId: '',
    quantity: '',
    targetLocationId: '',
    label: '',
    typeFilter: 'ALL',
    fromDate: this.defaultDateRange.fromDate,
    toDate: this.defaultDateRange.toDate,
  };

  componentDidMount() {
    void this.load();
  }

  private async load() {
    this.setState({ loading: true, error: null });
    try {
      const data = await this.gql<{
        movements: MovementRecord[];
        products: MovementProduct[];
      }>(INITIAL_QUERY, {
        fromDate: this.state.fromDate,
        toDate: this.state.toDate,
      });
      this.setState({
        movements: data.movements,
        products: data.products,
        loading: false,
      });
    } catch (error) {
      this.setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load movements',
      });
    }
  }

  private getProductName(
    product: { name: IMLString | string } | null
  ): string {
    if (!product) return '-';
    if (typeof product.name !== 'string') {
      return this.toString(product.name);
    }
    try {
      return this.toString(JSON.parse(product.name));
    } catch {
      return product.name;
    }
  }

  private getVariantLabel(productId: string): string[] {
    return (this.state.products.find((product) => product.id === productId)?.variants || [])
      .map((variant) => {
        return typeof variant.label === 'string' ? variant.label : variant.label.default;
      });
  }

  private handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const quantity = Number(this.state.quantity);
    if (!this.state.productId || !Number.isFinite(quantity) || quantity <= 0) {
      this.setState({ error: 'Выберите товар и укажите положительное количество.' });
      return;
    }
    if (
      (this.state.type === 'MOVE_IN' || this.state.type === 'MOVE_OUT') &&
      !this.state.targetLocationId
    ) {
      this.setState({ error: 'Выберите склад для перемещения.' });
      return;
    }

    this.setState({ saving: true, error: null, notice: null });
    try {
      await this.gql(CREATE_MOVEMENT_MUTATION, {
        input: {
          type: this.state.type,
          productId: this.state.productId,
          variantLabel: this.state.variantLabel || null,
          batchId: this.state.batchId || null,
          quantity,
          targetLocationId: this.state.targetLocationId || null,
          label: this.state.label || null,
        },
      });
      this.setState({
        saving: false,
        notice: 'Движение создано.',
        quantity: '',
        batchId: '',
        label: '',
      });
      await this.load();
    } catch (error) {
      this.setState({
        saving: false,
        error: error instanceof Error ? error.message : 'Failed to create movement',
      });
    }
  };

  private typeLabel(type: string): string {
    return MOVEMENT_TYPES.find(([value]) => value === type)?.[1] || type;
  }

  render() {
    const {
      movements,
      products,
      loading,
      saving,
      error,
      notice,
      typeFilter,
      fromDate,
      toDate,
    } = this.state;
    const locations = this.props.companyInfo?.locations || [];
    const visibleMovements =
      typeFilter === 'ALL'
        ? movements
        : movements.filter((movement) => movement.type === typeFilter);
    const variantLabels = this.getVariantLabel(this.state.productId);

    return (
      <div className="section-inner tool-page-inner">
        <p className="section-label">Staff</p>
        <h1 className="section-title">Движения</h1>
        <p className="section-desc">Учёт поступлений, списаний, продаж, производства и перемещений.</p>

        {error && <div className="notice error">{error}</div>}
        {notice && <div className="notice success">{notice}</div>}

        <form className="movement-create-form" onSubmit={this.handleCreate}>
          <label>
            <span>Вид движения</span>
            <select value={this.state.type} onChange={(event: ChangeEvent<HTMLSelectElement>) => this.setState({ type: event.target.value })}>
              {MOVEMENT_TYPES.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Товар</span>
            <select value={this.state.productId} onChange={(event: ChangeEvent<HTMLSelectElement>) => this.setState({ productId: event.target.value, variantLabel: '' })}>
              <option value="">Выберите товар</option>
              {products.sort((a, b) => this.getProductName(a).localeCompare(this.getProductName(b))).map((product) => (
                <option key={product.id} value={product.id}>{this.getProductName(product)}</option>
              ))}
            </select>
          </label>
          {variantLabels.length > 0 && (
            <label>
              <span>Вариант</span>
              <select value={this.state.variantLabel} onChange={(event: ChangeEvent<HTMLSelectElement>) => this.setState({ variantLabel: event.target.value })}>
                <option value="">Без варианта</option>
                {variantLabels.map((label) => (
                  <option key={label} value={label}>{label}</option>
                ))}
              </select>
            </label>
          )}
          {(this.state.type === 'MOVE_IN' || this.state.type === 'MOVE_OUT') && (
            <label>
              <span>Склад назначения / источник</span>
              <select value={this.state.targetLocationId} onChange={(event: ChangeEvent<HTMLSelectElement>) => this.setState({ targetLocationId: event.target.value })}>
                <option value="">Выберите склад</option>
                {locations.filter((location) => location.id !== this.props.currentLocation).map((location) => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
            </label>
          )}
          <label>
            <span>Количество</span>
            <input type="number" min="0.001" step="0.001" value={this.state.quantity} onChange={(event: ChangeEvent<HTMLInputElement>) => this.setState({ quantity: event.target.value })} />
          </label>
          <label>
            <span>Комментарий</span>
            <input type="text" value={this.state.label} onChange={(event: ChangeEvent<HTMLInputElement>) => this.setState({ label: event.target.value })} />
          </label>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? 'Сохранение...' : 'Создать движение'}
          </button>
        </form>

        <div className="movement-filters">
          <label>
            <span>Период с</span>
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                this.setState({ fromDate: event.target.value })
              }
            />
          </label>
          <label>
            <span>Период по</span>
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                this.setState({ toDate: event.target.value })
              }
            />
          </label>
          <label>
            <span>Фильтр по виду</span>
            <select value={typeFilter} onChange={(event: ChangeEvent<HTMLSelectElement>) => this.setState({ typeFilter: event.target.value })}>
              <option value="ALL">Все виды</option>
              {MOVEMENT_TYPES.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <button
            className="secondary-button movement-filter-button"
            type="button"
            onClick={() => void this.load()}
            disabled={loading}
          >
            Показать
          </button>
        </div>

        {loading ? (
          <p>Загрузка...</p>
        ) : (
          <div className="cj-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Вид</th>
                  <th>Товар</th>
                  <th>Вариант</th>
                  <th>Партия</th>
                  <th>Количество</th>
                  <th>Склад</th>
                  <th>Пользователь</th>
                </tr>
              </thead>
              <tbody>
                {visibleMovements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{this.toLocalDate(movement.createdAt)}</td>
                    <td>{this.typeLabel(movement.type)}</td>
                    <td>{this.getProductName(movement.product)}</td>
                    <td>{movement.variantLabel || '-'}</td>
                    <td>{movement.batch?.numberStr || '-'}</td>
                    <td>{this.toFixed(movement.quantity)}</td>
                    <td>{movement.location?.name || movement.locationId}</td>
                    <td>{movement.user?.fullName || movement.user?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && visibleMovements.length === 0 && <p>Движений не найдено.</p>}
          </div>
        )}
      </div>
    );
  }
}

export default StaffMovements;
