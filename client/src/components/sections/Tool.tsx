import Proto from '../../proto';
import { type User } from '../../App';
import CleaningJournal from './CleaningJournal';

interface ToolProps {
  activeChapter: string;
  user: User | null;
}

class Tool extends Proto<ToolProps, Record<string, never>> {
  render() {
    const { activeChapter, user } = this.props;

    return (
      <section className="tool-page" id="tool">
        {activeChapter === 'Cleaning' ? (
          <CleaningJournal user={user} />
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
