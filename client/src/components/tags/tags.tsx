import { ReactNode } from "react";
import "./tags.css";
import React from "react";
import { IMLString } from "../../mlstring";

export type ITags = IMLString[];
export interface ITagsProps {
	defaultValue?: IMLString[];
	editMode: boolean;
	onChange?: (newTags: IMLString[]) => void;
}

export interface ITagsState {
	value: IMLString[];
}

export default class Tags extends React.Component<ITagsProps, ITagsState> {
	state: ITagsState = {
		value: this.props.defaultValue ? this.props.defaultValue : [],
	};
	get value(): IMLString[] {
		return this.state.value;
	}
	render(): ReactNode {
		return (
			<div className={`tags-container ${this.props.editMode ? "has-caption" : ""}`}>
				{this.props.editMode ? <div className="caption">TAGS</div> : <></>}
				{this.state.value.map((s, idx) => (
					<span className="has-context-toolbar" key={idx}>
						{s.toString()}
						{this.props.editMode ? (
							<span className="context-toolbar">
								<span
									data-index={idx}
									onClick={_ => {
										const nState = this.state;
										nState.value.splice(idx, 1);
										this.setState(nState);
										if (this.props.onChange !== undefined) this.props.onChange(this.value);
									}}>
									⤬
								</span>
							</span>
						) : (
							<></>
						)}
					</span>
				))}
				{this.props.editMode ? (
					<span
						contentEditable
						onKeyUp={event => {
							if (event.key === "Enter") {
								const nState = this.state;
								nState.value.push(event.currentTarget.innerText.replaceAll("\n", ""));
								this.setState(nState);
								event.currentTarget.innerText = "";
								if (this.props.onChange !== undefined) this.props.onChange(this.value);
							}
						}}></span>
				) : (
					<></>
				)}
			</div>
		);
	}
}
