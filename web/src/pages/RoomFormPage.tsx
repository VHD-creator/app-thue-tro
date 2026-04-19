import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createRoom, fetchRoomById, updateRoom, deleteRoom, fetchRoomImages, uploadRoomImages } from '../api/api';
import { Room, RoomPayload, RoomImage, User } from '../types';

type Props = {
  user: User | null;
};

export default function RoomFormPage({ user }: Props) {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Image upload states
  const [images, setImages] = useState<RoomImage[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      setLoading(true);
      Promise.all([
        fetchRoomById(Number(id)),
        fetchRoomImages(Number(id))
      ])
        .then(([roomData, imagesData]) => {
          setRoom(roomData);
          setName(roomData.ten_phong);
          setPrice(roomData.gia_phong.toString());
          setDescription(roomData.mo_ta || '');
          setStatus(roomData.trang_thai);
          setImages(imagesData);
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Không tải được phòng'))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      setError('Tối đa 10 ảnh cho mỗi phòng');
      return;
    }

    setSelectedFiles(files);
    // Create preview URLs
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    setError('');
  }

  async function handleUploadImages() {
    if (selectedFiles.length === 0) {
      setError('Chọn ít nhất một ảnh');
      return;
    }

    if (!id || isNew) {
      setError('Vui lòng lưu phòng trước khi tải ảnh');
      return;
    }

    setUploadingImages(true);
    try {
      await uploadRoomImages(Number(id), selectedFiles);
      setSuccess('Tải ảnh thành công');
      setSelectedFiles([]);
      setPreviewUrls([]);
      
      // Refresh images
      const imagesData = await fetchRoomImages(Number(id));
      setImages(imagesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải ảnh');
    } finally {
      setUploadingImages(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const payload: RoomPayload = {
      ten_phong: name.trim(),
      gia_phong: Number(price),
      mo_ta: description.trim(),
      trang_thai: status
    };

    try {
      if (isNew) {
        await createRoom(payload);
        setSuccess('Tạo phòng thành công');
        navigate('/rooms');
      } else if (id) {
        await updateRoom(Number(id), payload);
        setSuccess('Cập nhật phòng thành công');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu phòng');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!window.confirm('Bạn có chắc muốn xóa phòng này?')) return;
    setLoading(true);
    try {
      await deleteRoom(Number(id));
      navigate('/rooms');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi xóa phòng');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>{isNew ? 'Thêm phòng mới' : 'Sửa phòng'}</h2>
          <p className="text-muted">{isNew ? 'Tạo mới phòng trọ' : 'Cập nhật thông tin phòng'}</p>
        </div>
      </div>
      
      <div className="card" style={{ maxWidth: 640, padding: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label htmlFor="roomName">Tên phòng</label>
            <input id="roomName" value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <div>
            <label htmlFor="roomPrice">Giá phòng (VNĐ)</label>
            <input id="roomPrice" type="number" value={price} onChange={(event) => setPrice(event.target.value)} required />
          </div>
          <div>
            <label htmlFor="roomDescription">Mô tả</label>
            <textarea id="roomDescription" value={description} onChange={(event) => setDescription(event.target.value)} rows={4} />
          </div>
          <div>
            <label htmlFor="roomStatus">Trạng thái</label>
            <select id="roomStatus" value={status} onChange={(event) => setStatus(Number(event.target.value))}>
              <option value={0}>Còn trống</option>
              <option value={1}>Đang thuê</option>
              <option value={2}>Đang chờ</option>
            </select>
          </div>
          {error ? <div style={{ color: '#b91c1c', fontWeight: 600 }}>{error}</div> : null}
          {success ? <div style={{ color: '#0f766e', fontWeight: 600 }}>{success}</div> : null}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
            {!isNew ? (
              <button type="button" className="button button-secondary" onClick={handleDelete} disabled={loading}>
                Xóa phòng
              </button>
            ) : null}
            <button type="button" className="button button-secondary" onClick={() => navigate('/rooms')}>
              Quay lại
            </button>
          </div>
        </form>
      </div>

      {/* Image Upload Section */}
      {!isNew && id && (
        <div className="card" style={{ maxWidth: 640, padding: 24, marginTop: 24 }}>
          <h3>📸 Quản lý hình ảnh phòng</h3>
          <p className="text-muted" style={{ marginBottom: 16 }}>Tối đa 10 ảnh cho mỗi phòng</p>

          {/* Current Images */}
          {images.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h4>Hình ảnh hiện tại ({images.length})</h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: 12,
                marginTop: 12
              }}>
                {images.map((img) => (
                  <div key={img.id_hinh_anh} style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '100%',
                    backgroundColor: '#f3f4f6',
                    borderRadius: 8,
                    overflow: 'hidden'
                  }}>
                    <img
                      src={img.duong_dan}
                      alt={img.ten_file}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    {img.la_anh_dai_dien && (
                      <div style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: '#fbbf24',
                        color: '#78350f',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        ⭐
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Images Preview */}
          {previewUrls.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h4>Xem trước ảnh mới ({previewUrls.length})</h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: 12,
                marginTop: 12
              }}>
                {previewUrls.map((url, idx) => (
                  <div key={idx} style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '100%',
                    backgroundColor: '#f3f4f6',
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: '2px dashed #d1d5db'
                  }}>
                    <img
                      src={url}
                      alt={`preview-${idx}`}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Form */}
          <div style={{
            padding: 16,
            backgroundColor: '#f9fafb',
            border: '2px dashed #d1d5db',
            borderRadius: 8,
            textAlign: 'center'
          }}>
            <label htmlFor="imageUpload" style={{ cursor: 'pointer' }}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>📁</span>
              </div>
              <input
                id="imageUpload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploadingImages}
                style={{ display: 'none' }}
              />
              <p style={{ margin: 0, fontWeight: 600 }}>Chọn ảnh để tải lên</p>
              <small style={{ color: '#666' }}>Hoặc kéo thả file vào đây (JPEG, PNG, GIF, WEBP)</small>
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <button
              type="button"
              className="button button-primary"
              onClick={handleUploadImages}
              disabled={uploadingImages}
              style={{ marginTop: 16, width: '100%' }}
            >
              {uploadingImages ? 'Đang tải...' : `Tải ${selectedFiles.length} ảnh`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
