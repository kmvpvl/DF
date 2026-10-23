import { IMLString, MLString } from "../../mlstring";
import "./mlstring.css";
import React, { RefObject } from "react";

export enum ViewModeCode {
	compact = "compact",
	normal = "normal",
	maximized = "maximized",
}

export interface IMLStringEditorProps {
	defaultValue?: IMLString;
	caption?: string;
	onChange?: (newMLString: IMLString) => void;
	className?: string;
	viewMode?: ViewModeCode;
}

export interface IMLStringEditorState {
	value: IMLString;
	viewMode: ViewModeCode;
	curLanguageIndex?: string;
}

export default class MLStringEditor extends React.Component<IMLStringEditorProps, IMLStringEditorState> {
	state: IMLStringEditorState = {
		value: this.props.defaultValue !== undefined ? this.props.defaultValue : "",
		viewMode: this.props.viewMode !== undefined ? this.props.viewMode : ViewModeCode.compact,
		curLanguageIndex: undefined,
	};
	compactEditRef?: RefObject<HTMLInputElement> = React.createRef();
	compactNewLangRef?: RefObject<HTMLSelectElement> = React.createRef();
	componentDidUpdate(_: Readonly<IMLStringEditorProps>, __: Readonly<IMLStringEditorState>, ___?: any): void {
		if (this.state.viewMode === ViewModeCode.compact) {
			if (typeof this.state.value === "object" && new MLString(this.state.value).entries.filter(el => el[0] === "").length > 0) {
				this.compactNewLangRef?.current?.focus();
			}
		}
	}
	get value(): IMLString {
		return this.state.value;
	}
	get languages(): Array<string> {
		return (import.meta.env.VITE_LANGUAGES !== undefined ? import.meta.env.VITE_LANGUAGES : "en,ru,sr").split(",");
	}
	renderCompact(): React.ReactNode {
		const ret = (
			<div className="mlstring-editor-compact">
				<span>{this.props.caption}</span>
				<span>
					{typeof this.state.value !== "string" ? (
						<span
							onClick={_ => {
								this.setState({ ...this.state, curLanguageIndex: undefined });
							}}
							className={this.state.curLanguageIndex === undefined ? "selected" : ""}>
							default
						</span>
					) : (
						<></>
					)}
					{typeof this.state.value !== "string" ? (
						Object.entries(this.state.value.ts).map((v, idx) => {
							if (this.state.curLanguageIndex === v[0] || v[0] === "")
								return (
									<select
										key={`sel_${idx}`}
										ref={this.compactNewLangRef}
										defaultValue={v[0]}
										onChange={event => {
											const nState: IMLStringEditorState = this.state;
											delete (nState.value as any).ts[this.state.curLanguageIndex!];
											(nState.value as any).ts[event.currentTarget.value] = "";
											nState.curLanguageIndex = event.currentTarget.value;
											this.setState(nState);
											if (this.props.onChange !== undefined) this.props.onChange(this.state.value);
											if (event.currentTarget.value !== "") this.compactEditRef?.current?.focus();
										}}>
										<option key={-1}></option>
										{this.languages.map((v, i) => (
											<option key={i} value={v}>
												{v}
											</option>
										))}
									</select>
								);
							else
								return (
									<span
										data-idx={idx}
										key={idx}
										onClick={event => {
											const idx_str = event.currentTarget.getAttribute("data-idx");
											if (idx_str) this.setState({ ...this.state, curLanguageIndex: v[0] });
										}}>
										{v[0]}
									</span>
								);
						})
					) : (
						<></>
					)}
					<label>|</label>
					<span onClick={this.addNewLanguage.bind(this)}>+</span>
					{this.state.curLanguageIndex !== undefined ? (
						<span
							onClick={_ => {
								const nState = this.state;
								delete (nState.value as any).ts[this.state.curLanguageIndex!];
								nState.curLanguageIndex = undefined;
								if (this.props.onChange !== undefined) this.props.onChange(this.value);
								this.setState(nState);
							}}>
							<span style={{ transform: "rotate(45deg)", display: "block" }}>+</span>
						</span>
					) : (
						<></>
					)}
				</span>
				<input
					type="text"
					ref={this.compactEditRef}
					key={this.state.curLanguageIndex}
					defaultValue={typeof this.state.value === "string" ? (this.state.value as string) : this.state.curLanguageIndex === undefined ? this.state.value?.default : this.state.value.ts[this.state.curLanguageIndex]}
					onChange={event => {
						const nState = this.state;
						if (nState.curLanguageIndex === undefined) {
							if (typeof nState.value === "string") nState.value = event.currentTarget.value;
							else (nState.value as any).default = event.currentTarget.value;
						} else (nState.value as any).ts[this.state.curLanguageIndex!] = event.currentTarget.value;
						//this.setState(nState);
						if (this.props.onChange !== undefined) this.props.onChange(this.value);
					}}
				/>
			</div>
		);
		return ret;
	}
	addNewLanguage() {
		if (this.state.value !== undefined) {
			const nState = this.state;
			if (typeof nState.value !== "object") {
				(nState.value as any) = {
					default: nState.value,
					ts: {},
				};
			} else {
				nState.value.ts[""] = "";
			}
			nState.curLanguageIndex = "";
			this.setState(nState);
		}
	}
	render(): React.ReactNode {
		if (this.state.viewMode === ViewModeCode.compact) return this.renderCompact();
		return (
			<div className={`mlstring-editor-container has-caption ${this.props.className}`}>
				<div className="caption">{this.props.caption}</div>
				<div className="toolbar">
					<span onClick={this.addNewLanguage.bind(this)}>+</span>
				</div>
				<div className="mlstring-editor-default">
					<input
						defaultValue={typeof this.state.value === "string" ? (this.state.value as string) : this.state.value?.default}
						onChange={event => {
							const nState = this.state;

							if (typeof nState.value === "object") {
								nState.value.default = event.currentTarget.value;
							} else {
								(nState.value as any) = {
									default: event.currentTarget.value,
									ts: {},
								};
							}
							if (this.props.onChange !== undefined) this.props.onChange(this.value);
							this.setState(nState);
						}}
					/>
				</div>
				{this.state.value !== undefined && (this.state.value as any).ts !== undefined ? (
					new MLString(this.state.value).entries.map((langString: any, idx: any) => (
						<div className="mlstring-editor-value" key={idx}>
							<div className="mlstring-editor-value-toolbar">
								<span
									data-value-index={idx}
									onClick={event => {
										const index = event.currentTarget.getAttribute("data-value-index");
										const nState = this.state;
										(nState.value as any).values.splice(index, 1);
										if (this.props.onChange !== undefined) this.props.onChange(this.value);
										this.setState(nState);
									}}>
									✖
								</span>
							</div>
							<select
								data-value-index={idx}
								defaultValue={langString[0]}
								onChange={event => {
									const index = event.currentTarget.getAttribute("data-value-index");
									const nState = this.state;
									if (index) {
										(nState.value as any).values[index][0] = event.currentTarget.value;
										if (this.props.onChange !== undefined) this.props.onChange(this.value);
										this.setState(nState);
									}
								}}>
								<option key={-1}></option>
								{this.languages.map((v, i) => (
									<option key={i} value={v}>
										{v}
									</option>
								))}
							</select>
							<input
								data-value-index={idx}
								defaultValue={langString[1]}
								onChange={event => {
									const index = event.currentTarget.getAttribute("data-value-index");
									const nState = this.state;
									if (index) {
										(nState.value as any).values[index][1] = event.currentTarget.value;
										if (this.props.onChange !== undefined) this.props.onChange(this.value);
										this.setState(nState);
									}
								}}></input>
						</div>
					))
				) : (
					<></>
				)}
			</div>
		);
	}
}
