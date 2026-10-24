import { ReactNode } from "react";
import "./photos.css";
import React from "react";
//import QRCode from "react-qr-code";
import { IMLString } from "../../mlstring";
import { ITags } from "../tags/tags";

export interface IPhoto {
    url: string;
    caption?: IMLString;
    tags?: ITags;
}

export interface IPhotosProps {
	defaultValue?: IPhoto[];
	onChange?: (newValue: IPhoto[]) => void;
	editMode?: boolean;
	className?: string;
}

export interface IPhotosState {
	value: IPhoto[];
	currentPhotoIndex?: number;
	qr?: string;
}

export default class Photos extends React.Component<IPhotosProps, IPhotosState> {
	private touchesCoords?: { clientX: number; clientY: number };
	state: IPhotosState = {
		value: this.props.defaultValue !== undefined ? this.props.defaultValue : [],
		currentPhotoIndex: this.props.defaultValue !== undefined && this.props.defaultValue.length > 0 ? 0 : undefined,
	};
	get value() {
		return this.state.value;
	}
	private async uploadFileToServer(file: File): Promise<string> {
		const formData = new FormData();
		formData.append("image", file);

		const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/upload-image`, {
			method: "POST",
			body: formData,
		});
		
		if (!response.ok) throw new Error("Ошибка загрузки");
		
		const data = await response.json();
		return data.url; // Возвращает путь типа "/uploads/my-photo.jpg"
	}
	protected async editModeLoadImages(files: FileList) {
		for (let i = 0; i < files.length; i++) {
			const file = files[i];

			if (!file.type.startsWith("image/")) continue;

			try {
				// Загружаем на сервер и получаем URL
				const url = await this.uploadFileToServer(file);

				// Обновляем состояние
				const nState = { ...this.state }; // Создаем копию стейта
				nState.value.push({
					url: url,
					caption: undefined, // или пустой объект, в зависимости от IMLString
				});
				
				this.setState(nState);
				if (this.props.onChange) this.props.onChange(nState.value);
				
			} catch (error) {
				console.error("Не удалось загрузить изображение:", error);
				alert("Ошибка при загрузке файла");
			}
		}
	}
	nextPhoto(cycle: boolean = true) {
		if (this.state.value.length === 0) return;
		if (this.state.currentPhotoIndex !== undefined && this.state.currentPhotoIndex + 1 >= this.state.value.length && !cycle) return;
		const nState = this.state;
		nState.currentPhotoIndex = nState.currentPhotoIndex !== undefined ? nState.currentPhotoIndex + 1 : 0;
		if (nState.currentPhotoIndex + 1 > nState.value.length) nState.currentPhotoIndex = 0;
		this.setState(nState);
	}

	prevPhoto(cycle: boolean = true) {
		if (this.state.value.length === 0 || (this.state.currentPhotoIndex === 0 && !cycle)) return;
		const nState = this.state;
		nState.currentPhotoIndex = nState.currentPhotoIndex !== undefined ? nState.currentPhotoIndex - 1 : 0;
		if (nState.currentPhotoIndex < 0) nState.currentPhotoIndex = nState.value.length - 1;
		this.setState(nState);
	}
	qr(text: string) {
		if (this.props.editMode) return;
		const nState = this.state;
		nState.currentPhotoIndex = undefined;
		nState.qr = text;
		this.setState(nState);
	}
	componentDidUpdate(_: Readonly<IPhotosProps>, __: Readonly<IPhotosState>, ___?: any): void {
		if (!this.props.editMode && this.props.defaultValue !== undefined) {
			const nState = this.state;
			if (nState.value === this.props.defaultValue) return;
			nState.value = this.props.defaultValue;
			(nState.currentPhotoIndex = this.props.defaultValue !== undefined && this.props.defaultValue.length > 0 ? 0 : undefined), this.setState(nState);
		}
	}

	renderEditMode(): ReactNode {
		return (
			<div className={`photos-admin-edit-container has-caption ${this.props.className !== undefined ? this.props.className : ""}`}>
				<span className="caption">Photos</span>
				<div className="toolbar">
					<label>
						+
						<input
							type="file"
							id="inputImages"
							hidden
							multiple
							accept="image/*"
							onChange={event => {
								const files = event.currentTarget.files;
								if (files) this.editModeLoadImages(files);
								event.currentTarget.value = "";
							}}></input>
					</label>
				</div>
				<div className="photos-admin-list-container">
					<div
						className="photo-admin-container drop-zone"
						onDragEnter={event => {
							event.preventDefault();
							event.dataTransfer.dropEffect = "copy";
							event.currentTarget.classList.toggle("ready-to-drop", true);
							console.log("Enter");
						}}
						onDragLeave={event => {
							console.log("leave");
							event.preventDefault();
							event.currentTarget.classList.toggle("ready-to-drop", false);
						}}
						onDragEnd={event => {
							console.log("end");
							event.preventDefault();
							event.currentTarget.classList.toggle("ready-to-drop", false);
						}}
						onDragOver={event => {
							console.log("Over");
							event.preventDefault();
							event.dataTransfer.dropEffect = "copy";
						}}
						onDrop={event => {
							console.log("Drop");
							const dt = event.dataTransfer;
							const files = dt.files;
							this.editModeLoadImages(files);
							event.preventDefault();
							event.currentTarget.classList.toggle("ready-to-drop", false);
						}}>
						Drop image here
					</div>
					{this.state.value.map((photo, idx) => (
						<span className="photo-admin-container has-context-toolbar" key={idx}>
							<span className="context-toolbar">
								<span
									onClick={_ => {
										const nState = this.state;
										nState.value.splice(idx, 1);
										this.setState(nState);
										if (this.props.onChange !== undefined) this.props.onChange(this.state.value);
									}}>
									<span style={{ transform: "rotate(45deg)", display: "block" }}>+</span>
								</span>
							</span>
							<img src={`${import.meta.env.VITE_API_BASE_URL}${photo.url}`} />
						</span>
					))}
				</div>
			</div>
		);
	}
	render(): ReactNode {
		return (
			<>
				{this.props.editMode ? (
					this.renderEditMode()
				) : (
					<div className={`${this.props.className !== undefined ? this.props.className : ""} photos-container`}>
						<div
							className="photo-container"
							onClick={_ => {
								this.nextPhoto();
							}}
							onTouchStart={event => {
								event.stopPropagation();
								if (event.touches.length === 1) {
									this.touchesCoords = event.touches[0];
								}
							}}
							onTouchMove={event => {
								event.stopPropagation();
								if (event.touches.length === 1 && this.touchesCoords !== undefined) {
									if (event.touches[0].clientX > this.touchesCoords.clientX + 20) {
										this.touchesCoords = event.touches[0];
										this.nextPhoto();
									}
									if (event.touches[0].clientX < this.touchesCoords.clientX - 20) {
										this.touchesCoords = event.touches[0];
										this.prevPhoto();
									}
								}
							}}>
							{this.state.currentPhotoIndex !== undefined ? (
								<img src={this.state.value[this.state.currentPhotoIndex].url}></img>
//							) : this.state.qr !== undefined ? (
								//<QRCode style={{ height: "auto", maxWidth: "100%", maxHeight: "100%" }} value={this.state.qr} size={256} viewBox={"0 0 256 256"} />
							) : (
								<img src={emptyDish} />
							)}
						</div>
						{this.state.value.length !== 1 ? (
							<div className="photos-scroll">
								{this.state.value.map((_, idx) => (
									<svg
										width="8px"
										height="8px"
										viewBox="0 0 8 8"
										data-index={idx}
										key={idx}
										onMouseOver={event => {
											const key = event.currentTarget.attributes.getNamedItem("data-index")?.value;
											if (key !== undefined) {
												const i = parseInt(key);
												if (i !== this.state.currentPhotoIndex) {
													const nState = this.state;
													nState.currentPhotoIndex = i;
													this.setState(nState);
												}
											}
										}}>
										{idx === this.state.currentPhotoIndex ? <circle cx="4" cy="4" r="3" fill="silver" stroke="gray"></circle> : <circle cx="4" cy="4" r="3" fill="transparent" stroke="gray"></circle>}
									</svg>
								))}
							</div>
						) : (
							<div></div>
						)}
					</div>
				)}
			</>
		);
	}
}
const emptyDish =
	"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxMQERIQEBIQEBIQEREXERITExUQEBYSFRUXGBUVFxUZHSggGBslHRgVITEhJSorLi4uFx8zODMtNygtLisBCgoKBQUFDgUFDisZExkrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrK//AABEIAMkA+wMBIgACEQEDEQH/xAAbAAEAAgMBAQAAAAAAAAAAAAAABAYDBQcBAv/EAEIQAAIBAgIECggEBAUFAAAAAAABAgMRBBIFBiExExRBUVNhcZGx0RUiMlJzgZKhNEKCwTNDcrIWI2Lh8CRUY6LS/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AO4gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMdSvCPtSjHtkkfHHKfSU/rj5gZwYOOU+kp/XHzHHKfSU/rj5gZwYOOU+kp/XHzHHKfSU/rj5gZwYOOU+kp/XHzHHKfSU/rj5gZwYOOU+kp/XHzHHKfSU/rj5gZwYOOU+kp/XHzHHKfSU/rj5gZwYOOU+kp/XHzHHKfSU/rj5gZwYVi6b3Tg/wBSMwAAAAAAAAAAAAAAAAAAARtIY6FCDnUdlyLlb5kilaS0/VrNpSdOHJGLs/nLez40/pF16rafqQbUFyW5ZfPyNYAYsAAsLAALCwACwsAAsLAALCwNhoTRvGKmS7UUrza325l1sDX2Fi//AOHsPly8H880s3fcqGm9G8XqZL3jJXg3vtzPrQGvsS8FpKrRd6c5Je69sH+l7CIAL7oPTkcQsrtColtjyPrj5G3OXUarhJTi7Si7p9Z0fRmMValCotmZbVzSWxrvAlAAAAAAAAAAAAABE0rVyUKslvVOVu2xLIGnfw1b4cgOdAAAAAAAAH3RpSm1GEXKT3JK7JGjNHyxE1CHbKXJFc5fdG6Np0I5YLb+aT9qT63+wFXwmqlWW2co01ze3LuWz7k5aoR5as/pSLMAKjiNUJL+HVjLqknH7q5o8do+pRdqkHHme+L7GdKPitSjNOMkpJ701dAcuN5qnjY0qrjNpKpFJN7syezv2jWHQfAf5lO7pN9ri+Z9XWaMDqdyka242NWqowaappptbsze1Ls2Gp43Uy5eEqZfdzSy91zCAAAAuGpNS9OpH3Zpr9S/2KeWzUf2a3bDwYFoAAAAAAAAAAAAACBp38NW+HInkDTv4at8OQHOgAAAAAAm6GocJXpRe5zTfYtr8ALpoDRyoUkmvXnaU+e75PkbMAAAAAAA+K1JTi4yV4yTTXUznGksI6NWdN/lex88XufcdKKjrtQtKlU95Si/0u68WBWQAAAAAtmo/s1u2Hgypls1H9mt2w8GBaAAAAAAAAAAAAAAgad/DVvhyJ5A07+GrfDkBzoAAAAANrqw7Ymn+r+1mqM+BxHB1IVPckm+zl+wHTQeRldJranufUegAAAAAArOu79Skv8AVLwRZil65YnNWjTX8uO3+qW3wsBXwAAAAAtmo/s1u2Hgypls1H9mt2w8GBaAAAAAAAAAAAAAAgad/DVvhyJ5A07+GrfDkBzoAAAAAAAFy1T0pnhwE368F6vXBcnavAsRy6nUcWpRbTi7prY0y36H1mjNKFdqE/e/JLt91/YCxA8jJNXVmnua2o9AAGs0npulQTTeefJCO1/PmAz6U0hGhTc5b/yx5ZS5Ec6rVXOUpyd5SbbfWyRpLSE8RPPN7vZivZiuZeZEAAAAAABbNR/ZrdsPBlTLZqP7Nb+qHgwLQAAAAAAAAAAAAAGHG0eEpzh78JLvVjMAOWSi07PY1sa6zwsWteiXCTrwV4yfrpfllz9j8SugAAAAAAAASMNjalP+HUnDqT2d24mx1ixK/md8IX8DVACdiNLV6myVWbXMnlX/AK2IIAAAAAAAAAAuupuHcaDm/wCZNtf0rYvvcq+idHSxFRQjsX55ckY+Z0OhSUIqEVaMUkl1IDIAAAAAAAAAAAAAAADyUU1ZpNPentRW9Jaqxk3KhJQb/JL2fk96LKAKBU1dxMX/AA83WpRa8T49A4noZd8fM6EAOe+gcT0Mu+PmPQOJ6GXfHzOhADnvoHE9DLvj5j0Diehl3x8zoQA576BxPQy74+Y9A4noZd8fM6EAOe+gcT0Mu+PmPQOJ6GXfHzOhADnvoHE9DLvj5j0Diehl3x8zoQA576BxPQy74+Y9A4noZd8fM6EAOfLQGJf8p/VBfubHA6pzbvWkoLmj60u/cvuXAAR8Fg4UY5KcVFfdvnb5WSAAAAAAAAAAAAAAAAAAKlLWScMTKM7cEpyi0ltSTtmvz8pZsVXy0p1I2eWnKUeZ2jdFHhgeHxNemnaV6zjzZlLYn9zYaH0k+ArYapdShSq5L77KLvH5f83AbTVjSM68Juo03GSs0rbGrkPSOsU3U4HDRUmm1mtmba35VzdbMGq83HD4mS3pNrtUHYakUlmqz5YqCXY738EAq6Sx1C06sE48t4xt3x3Fh0TpKOIhnjsadpRe9PyJGJpKcJRltUotPsaKpqRN8JUjyOCb7U9niwLeyvau6YqV6tSFS1lFuNla21K3XvLDLcU3U3+PU+G/7kBk0prHWhWnCGRRhJpJxu3bndyxcfXF+H5ODz267bu/YU7G0OExOIjyrhpLtir/ALGT0h/0HBX28Ll/R7f+wErRmsdadaEJ5HGc0mlGzV+Z3LdOaim3sSTbfUihYOhweJw8eV8DJ9srP9yx624zg6ORP1qrt+le1+y+YGpw+tFR1k5ZeCcrZbbVFvY786LimUzE6LSwMJ7M6eeXPlnst3ZX8mbrQ2Pc8I5XvOlCUXz3jHY+6wEXSmsUuE4HDRU5Xs5WzetzRS39pGr47H0VwlSKyrf6sWl25dqPjUmmnUqze1xjFL9Td/BG30rp6lRk6M4zk7LNZLLZrdtfMBI0JpRYmDlbLKLtOO/byNdTNBHTuKq1JQoxg7OVo5U3lTtvb7Da6t4jDyzxw8JQexyUtra5LO72FZ0XiqlKvOVKHCStNZbN7My22XyA3HGtIdGvpj/9Fkwzk4RzpKeVZktylbaV1acxf/av6Zr7lmi9ivs2bgPQAAAAAAAAAAAAAAAU/QP4+r21v7jJrbozK+MQ2X2VLc+5S+e5lnhh4Rk5qMVKXtSSSk+1mScU000mnvT2poCsamQUqdZPapSSfY47TX4apPR9dqcXKElbmzRvsknz9XaXShQjBZYRjBc0Ukr/ACPatKMlaUVJczSa+4FZ0nrTGVNxoxnmkms0kla/Ktu1knVLRsqUZVJpxlUtZPeorn7f2NvRwFKDvGnTi+dRSZJA8kU7U1f59T4b/uRcjFSw8INuMYxcneTSSbfWBVNHq+kai/1Vb9xp+JPh+A/8uX5ZrX7tp0OOHgpOajFTas5WWZrtHFoZ+EyRz+9ZZu8CqaQjbSNNL3qNuyyPjTN8VjFRV0o+r2cs3/zmRb5YeDkpuMXNKylZZku08WHgpOeWOdqzlZZrc1wK9/hCHSz7kQ9WpuliKmHnunmi11xvt+av9i5GJYeGbPljnas5WWa3aBTabno+u7xcqcrq/vRvss/eXMbLFay4dq/BynK2zNGPiyx1KakrSSknyNXRHho6jF3VKmnz5I38AK/qZh5KVSo4tRlFKLey+2+znNXojHxw+InOak1acbK17uS5+wvxgng6cnd04Nve3FNgaX/FtH3KvdHzN3hMQqsI1I3yzV1fYz54jS6Kn9EfIzxVti2JblyAegAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/2Q==";
