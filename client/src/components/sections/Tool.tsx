import Proto, { IProtoProps, IProtoState } from '../../proto';
import CleaningJournal from './CleaningJournal';
import Material from './Material';
import StaffBatches from './StaffBatches';
import StaffProducts from './StaffProducts';
import Samples from './Samples';
import Certificates from './Certificates';
import Orders from './StaffOrders';

interface ToolProps extends IProtoProps {
  activeChapter: string;
}

interface ToolState extends IProtoState {}

class Tool extends Proto<ToolProps, ToolState> {
  render() {
    const { activeChapter, user, companyInfo } = this.props;

    return (
      <section className="tool-page" id="tool">
        {activeChapter === 'Cleaning' ? (
          <CleaningJournal user={user} />
        ) : activeChapter === 'Material' ? (
          <Material />
        ) : activeChapter === 'Batches' ? (
          <StaffBatches />
        ) : activeChapter === 'Products' ? (
          <StaffProducts user={user} companyInfo={companyInfo} />
        ) : activeChapter === 'Samples' ? (
          <Samples />
        ) : activeChapter === 'Certificates' ? (
          <Certificates />
        ) : activeChapter === 'Orders' ? (
          <Orders user={user} />
        ) : (
          <div className="section-inner tool-page-inner">
            <p className="section-label">Staff</p>
            <h1 className="section-title">{activeChapter}</h1>
            <p className="section-desc">This section is coming soon.</p>
          </div>
        )}
      </section>
    );
  }
}

export default Tool;
