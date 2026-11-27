import { ReactNode } from 'react';
import './tags.css';
import React from 'react';
import { IMLString, MLString } from '../../mlstring';
import MLStringEditor from '../mlstring/mlstring';

export type ITags = IMLString[];
export interface ITagsProps {
  caption?: IMLString;
  defaultValue?: IMLString[];
  editMode: boolean;
  onChange?: (newTags: IMLString[]) => void;
}

export interface ITagsState {
  value: IMLString[];
  editorVersion: number;
}

const copyTag = (tag: IMLString): IMLString =>
  typeof tag === 'string' ? tag : { default: tag.default, ts: { ...tag.ts } };

export default class Tags extends React.Component<ITagsProps, ITagsState> {
  state: ITagsState = {
    value: this.props.defaultValue ? this.props.defaultValue.map(copyTag) : [],
    editorVersion: 0,
  };

  get value(): IMLString[] {
    return this.state.value;
  }

  private addTag = () => {
    const value = [...this.state.value, ''];
    this.setState({ value, editorVersion: this.state.editorVersion + 1 }, () =>
      this.props.onChange?.(value)
    );
  };

  private updateTag = (index: number, tag: IMLString) => {
    const value = [...this.state.value];
    value[index] = tag;
    this.setState({ value }, () => this.props.onChange?.(value));
  };

  private removeTag = (index: number) => {
    const value = this.state.value.filter((_, tagIndex) => tagIndex !== index);
    this.setState({ value, editorVersion: this.state.editorVersion + 1 }, () =>
      this.props.onChange?.(value)
    );
  };

  private renderEditMode(): ReactNode {
    const caption = this.props.caption
      ? new MLString(this.props.caption).toString()
      : 'TAGS';

    return (
      <div className="tags-editor-container">
        <div className="tags-editor-header">
          <div className="tags-editor-heading">
            <div className="tags-editor-caption">{caption}</div>
            <div className="tags-editor-hint">
              Edit each tag and its translations below.
            </div>
          </div>
          <button
            type="button"
            className="tags-editor-add"
            onClick={this.addTag}
          >
            + Add tag
          </button>
        </div>
        {this.state.value.length === 0 ? (
          <div className="tags-editor-empty">
            No tags yet. Select “Add tag” to create one.
          </div>
        ) : (
          <div className="tags-editor-list">
            {this.state.value.map((tag, index) => (
              <div
                className="tags-editor-item"
                key={`${this.state.editorVersion}-${index}`}
              >
                <div className="tags-editor-item-header">
                  <span className="tags-editor-item-title">
                    Tag {index + 1}
                  </span>
                  <button
                    type="button"
                    className="tags-editor-remove"
                    aria-label={`Remove tag ${index + 1}`}
                    onClick={() => this.removeTag(index)}
                  >
                    Remove
                  </button>
                </div>
                <MLStringEditor
                  caption="Tag text"
                  defaultValue={copyTag(tag)}
                  onChange={(value) => this.updateTag(index, value)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  render(): ReactNode {
    if (this.props.editMode) return this.renderEditMode();

    return (
      <div
        className={`tags-container ${this.props.editMode ? 'has-caption' : ''}`}
      >
        {this.state.value.map((s, idx) => (
          <span className="has-context-toolbar" key={idx}>
            {s.toString()}
          </span>
        ))}
      </div>
    );
  }
}
