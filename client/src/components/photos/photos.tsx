import { ReactNode } from 'react';
import './photos.css';
import React from 'react';
import { createPortal } from 'react-dom';
import { IPhoto } from '@df/types/photo';
//import QRCode from "react-qr-code";


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
  isZoomed?: boolean;
}

export default class Photos extends React.Component<
  IPhotosProps,
  IPhotosState
> {
  private touchesCoords?: { clientX: number; clientY: number };
  private zoomButtonRef = React.createRef<HTMLButtonElement>();
  private lightboxCloseButtonRef = React.createRef<HTMLButtonElement>();
  state: IPhotosState = {
    value: this.props.defaultValue !== undefined ? this.props.defaultValue : [],
    currentPhotoIndex:
      this.props.defaultValue !== undefined &&
      this.props.defaultValue.length > 0
        ? 0
        : undefined,
  };
  get value() {
    return this.state.value;
  }
  private async uploadFileToServer(
    file: File
  ): Promise<{ url: string; thumbnailUrl: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/upload-image`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) throw new Error('Ошибка загрузки');

    const data = await response.json();
    return {
      url: data.url,
      thumbnailUrl: data.thumbnailUrl,
    };
  }
  protected async editModeLoadImages(files: File[]) {
    const uploadedPhotos: IPhoto[] = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;

      try {
        const uploadedImage = await this.uploadFileToServer(file);
        uploadedPhotos.push({
          url: uploadedImage.url,
          thumbnailUrl: uploadedImage.thumbnailUrl,
          caption: undefined,
        });
      } catch (error) {
        console.error('Не удалось загрузить изображение:', error);
        alert('Ошибка при загрузке файла');
      }
    }

    if (uploadedPhotos.length > 0) {
      this.setState(
        (state) => ({ value: [...state.value, ...uploadedPhotos] }),
        () => this.props.onChange?.(this.state.value)
      );
    }
  }
  private movePhoto(fromIndex: number, toIndex: number) {
    if (
      toIndex < 0 ||
      toIndex >= this.state.value.length ||
      fromIndex === toIndex
    )
      return;

    const value = [...this.state.value];
    const [photo] = value.splice(fromIndex, 1);
    value.splice(toIndex, 0, photo);
    this.setState({ value }, () => this.props.onChange?.(value));
  }

  nextPhoto(cycle: boolean = true) {
    if (this.state.value.length === 0) return;
    if (
      this.state.currentPhotoIndex !== undefined &&
      this.state.currentPhotoIndex + 1 >= this.state.value.length &&
      !cycle
    )
      return;
    const nState = this.state;
    nState.currentPhotoIndex =
      nState.currentPhotoIndex !== undefined ? nState.currentPhotoIndex + 1 : 0;
    if (nState.currentPhotoIndex + 1 > nState.value.length)
      nState.currentPhotoIndex = 0;
    this.setState(nState);
  }

  prevPhoto(cycle: boolean = true) {
    if (
      this.state.value.length === 0 ||
      (this.state.currentPhotoIndex === 0 && !cycle)
    )
      return;
    const nState = this.state;
    nState.currentPhotoIndex =
      nState.currentPhotoIndex !== undefined ? nState.currentPhotoIndex - 1 : 0;
    if (nState.currentPhotoIndex < 0)
      nState.currentPhotoIndex = nState.value.length - 1;
    this.setState(nState);
  }
  qr(text: string) {
    if (this.props.editMode) return;
    const nState = this.state;
    nState.currentPhotoIndex = undefined;
    nState.qr = text;
    this.setState(nState);
  }
  componentDidUpdate(
    _: Readonly<IPhotosProps>,
    prevState: Readonly<IPhotosState>,
    ___?: any
  ): void {
    if (this.state.isZoomed !== prevState.isZoomed) {
      const focusTarget = this.state.isZoomed
        ? this.lightboxCloseButtonRef
        : this.zoomButtonRef;
      focusTarget.current?.focus();
    }

    if (!this.props.editMode && this.props.defaultValue !== undefined) {
      const nState = this.state;
      if (nState.value === this.props.defaultValue) return;
      nState.value = this.props.defaultValue;
      ((nState.currentPhotoIndex =
        this.props.defaultValue !== undefined &&
        this.props.defaultValue.length > 0
          ? 0
          : undefined),
        this.setState(nState));
    }
  }

  renderEditMode(): ReactNode {
    return (
      <div
        className={`photos-admin-edit-container has-caption ${this.props.className !== undefined ? this.props.className : ''}`}
      >
        <div className="photos-admin-header">
          <div className="photos-admin-heading">
            <span className="caption">Photos</span>
            <span className="photos-admin-count">
              {this.state.value.length}{' '}
              {this.state.value.length === 1 ? 'photo' : 'photos'}
            </span>
          </div>
          <label className="photos-admin-upload">
            <span className="photos-admin-upload-icon" aria-hidden="true">
              +
            </span>
            <span>Add photos</span>
            <input
              type="file"
              id="inputImages"
              hidden
              multiple
              accept="image/*"
              onChange={(event) => {
                const files = Array.from(event.currentTarget.files ?? []);
                if (files.length > 0) void this.editModeLoadImages(files);
                event.currentTarget.value = '';
              }}
            ></input>
          </label>
        </div>
        <div className="photos-admin-list-container">
          <div
            className="photo-admin-container drop-zone"
            onDragEnter={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'copy';
              event.currentTarget.classList.toggle('ready-to-drop', true);
              //console.log('Enter');
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              event.currentTarget.classList.toggle('ready-to-drop', false);
              //console.log('leave');
            }}
            onDragEnd={(event) => {
              event.preventDefault();
              event.currentTarget.classList.toggle('ready-to-drop', false);
              //console.log('end');
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'copy';
              //console.log('Over');
            }}
            onDrop={(event) => {
              const dt = event.dataTransfer;
              const files = Array.from(dt.files);
              void this.editModeLoadImages(files);
              event.preventDefault();
              event.currentTarget.classList.toggle('ready-to-drop', false);
              //console.log('Drop');
            }}
          >
            <span className="photos-admin-drop-icon" aria-hidden="true">
              ⇧
            </span>
            <span className="photos-admin-drop-title">Drop images here</span>
            <span className="photos-admin-drop-hint">or use “Add photos”</span>
          </div>
          {this.state.value.map((photo, idx) => (
            <div
              className="photo-admin-container has-context-toolbar"
              key={photo.url}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/photo-index', String(idx));
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(event) => {
                event.preventDefault();
                const fromIndex = Number(
                  event.dataTransfer.getData('text/photo-index')
                );
                if (Number.isInteger(fromIndex)) {
                  this.movePhoto(fromIndex, idx);
                }
              }}
            >
              <img
                src={`${import.meta.env.VITE_API_BASE_URL}${photo.thumbnailUrl ?? photo.url}`}
                alt={`Product photo ${idx + 1}`}
              />
              <div className="photos-admin-reorder" aria-label="Photo order">
                <button
                  type="button"
                  aria-label={`Move photo ${idx + 1} left`}
                  disabled={idx === 0}
                  onClick={() => this.movePhoto(idx, idx - 1)}
                >
                  ←
                </button>
                <button
                  type="button"
                  aria-label={`Move photo ${idx + 1} right`}
                  disabled={idx === this.state.value.length - 1}
                  onClick={() => this.movePhoto(idx, idx + 1)}
                >
                  →
                </button>
              </div>
              <button
                type="button"
                className="photos-admin-remove"
                aria-label={`Remove photo ${idx + 1}`}
                onClick={() => {
                  const value = this.state.value.filter((_, index) => index !== idx);
                  this.setState({ value }, () => this.props.onChange?.(value));
                }}
              >
                <span aria-hidden="true">×</span>
              </button>
              <span className="photos-admin-photo-index">Photo {idx + 1}</span>
            </div>
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
          <div
            className={`${this.props.className !== undefined ? this.props.className : ''} photos-container`}
          >
            <div
              className="photo-container"
              onClick={(_) => {
                this.nextPhoto();
              }}
              onTouchStart={(event) => {
                event.stopPropagation();
                if (event.touches.length === 1) {
                  this.touchesCoords = event.touches[0];
                }
              }}
              onTouchMove={(event) => {
                event.stopPropagation();
                if (
                  event.touches.length === 1 &&
                  this.touchesCoords !== undefined
                ) {
                  if (
                    event.touches[0].clientX >
                    this.touchesCoords.clientX + 20
                  ) {
                    this.touchesCoords = event.touches[0];
                    this.nextPhoto();
                  }
                  if (
                    event.touches[0].clientX <
                    this.touchesCoords.clientX - 20
                  ) {
                    this.touchesCoords = event.touches[0];
                    this.prevPhoto();
                  }
                }
              }}
            >
              {this.state.currentPhotoIndex !== undefined ? (
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL}${this.state.value[this.state.currentPhotoIndex].thumbnailUrl ?? this.state.value[this.state.currentPhotoIndex].url}`}
                  alt={`Product photo ${this.state.currentPhotoIndex + 1}`}
                ></img>
              ) : (
                //							) : this.state.qr !== undefined ? (
                //<QRCode style={{ height: "auto", maxWidth: "100%", maxHeight: "100%" }} value={this.state.qr} size={256} viewBox={"0 0 256 256"} />
                <img src={emptyDish} />
              )}
            </div>
            {this.state.currentPhotoIndex !== undefined && (
              <>
                <button
                  type="button"
                  className="photos-zoom-button"
                  aria-label="View full-size image"
                  title="View full-size image"
                  ref={this.zoomButtonRef}
                  onClick={(event) => {
                    event.stopPropagation();
                    this.setState({ isZoomed: true });
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <circle
                      cx="10.8"
                      cy="10.8"
                      r="6.3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="m15.5 15.5 5 5"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="2"
                    />
                  </svg>
                </button>
                {this.state.isZoomed &&
                  createPortal(
                    <div
                      className="photos-lightbox"
                      role="dialog"
                      aria-modal="true"
                      aria-label="Full-size product image"
                      onClick={() => this.setState({ isZoomed: false })}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          this.setState({ isZoomed: false });
                        } else if (event.key === 'Tab') {
                          event.preventDefault();
                          this.lightboxCloseButtonRef.current?.focus();
                        }
                      }}
                    >
                      <button
                        type="button"
                        className="photos-lightbox-close"
                        aria-label="Close image view"
                        ref={this.lightboxCloseButtonRef}
                        onClick={(event) => {
                          event.stopPropagation();
                          this.setState({ isZoomed: false });
                        }}
                      >
                        <span aria-hidden="true">×</span>
                      </button>
                      <img
                        className="photos-lightbox-image"
                        src={`${import.meta.env.VITE_API_BASE_URL}${this.state.value[this.state.currentPhotoIndex].url}`}
                        alt={`Product photo ${this.state.currentPhotoIndex + 1}`}
                        onClick={(event) => event.stopPropagation()}
                      />
                    </div>,
                    document.body
                  )}
              </>
            )}
            {this.state.value.length !== 1 ? (
              <div className="photos-scroll">
                {this.state.value.map((_, idx) => (
                  <svg
                    width="8px"
                    height="8px"
                    viewBox="0 0 8 8"
                    data-index={idx}
                    key={idx}
                    onMouseOver={(event) => {
                      const key =
                        event.currentTarget.attributes.getNamedItem(
                          'data-index'
                        )?.value;
                      if (key !== undefined) {
                        const i = parseInt(key);
                        if (i !== this.state.currentPhotoIndex) {
                          const nState = this.state;
                          nState.currentPhotoIndex = i;
                          this.setState(nState);
                        }
                      }
                    }}
                  >
                    {idx === this.state.currentPhotoIndex ? (
                      <circle
                        cx="4"
                        cy="4"
                        r="3"
                        fill="silver"
                        stroke="gray"
                      ></circle>
                    ) : (
                      <circle
                        cx="4"
                        cy="4"
                        r="3"
                        fill="transparent"
                        stroke="gray"
                      ></circle>
                    )}
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
  'data:image/jpeg;base64,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';
