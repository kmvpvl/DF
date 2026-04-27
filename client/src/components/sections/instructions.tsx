import { ReactNode } from "react";
import Proto, { IProtoProps, IProtoState } from "../../proto";
import { dictionaries } from "../../i18n/dictionaries";

export interface IInstructionsProps extends IProtoProps{

}

export interface IInstructionsState extends IProtoState {

}

export default class Instructions extends Proto <IInstructionsProps, IInstructionsState> {
    render(): ReactNode {
        const i18n = this.context;
        if (!i18n) {
        throw new Error('About must be used within I18nProvider');
        }

        const  content  = dictionaries.en.recipes;
        return <div id="instructions">
        <div className="section-inner">
          <p className="section-label">{this.ML(content.label)}</p>
            <h2 className="section-title">{this.ML(content.title)}</h2>
            <div className="section-desc">
            {content.items.map((s) => (
                <div key={s.name} className="stat" id={`instructions-${s.anchorId}`} style={{textAlign: "left"}}>
                <div className="stat-value">{this.ML(s.name)}</div>
                <div className="stat-label" dangerouslySetInnerHTML={{__html: this.ML(s.description)}}/>
                </div>
            ))}
            </div>
        </div>
        </div>
    }
}