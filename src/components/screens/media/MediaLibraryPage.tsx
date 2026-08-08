import { useEffect, useState } from 'react'
import { BusyLabel, EmptyState, ErrorState, Modal, SkeletonCardGrid, SkeletonKpiGrid, Topbar, Select } from '../../shared'
import { useToast } from '../../../context/ToastContext'
import { marketingService } from '../../../services/api/marketingService'
import { parseApiError } from '../../../services/api/apiClient'
import { transformMediaAsset, transformMediaLibrary, type MarketingMediaAsset } from '../../../services/transformers/marketingTransformers'
import { AppIcon } from '../../shared/AppIcon'
import { pluralize } from '../../../utils/formatters'

type MediaState = ReturnType<typeof transformMediaLibrary>

const divisionOptions = [
  ['real_estate', 'Real Estate'],
  ['benji', 'Benji'],
  ['engineering', 'Engineering'],
  ['surveying', 'Surveying'],
  ['ict', 'ICT'],
  ['agriculture', 'Agriculture'],
]

const assetTypeOptions = [
  ['image', 'Image'],
  ['video', 'Video'],
  ['document', 'Document'],
  ['audio', 'Audio'],
  ['design_source', 'Design Source'],
  ['other', 'Other'],
]

const statusOptions = [
  ['active', 'Active'],
  ['archived', 'Archived'],
]

const divCols: Record<string, string> = {
  re: 'bg-blue-100 text-blue-800',
  eng: 'bg-amber-100 text-amber-800',
  sur: 'bg-emerald-100 text-emerald-800',
  ben: 'bg-purple-100 text-purple-800',
  ict: 'bg-sky-100 text-sky-800',
  agr: 'bg-rose-100 text-rose-800',
}

function optionTuples(options: { value: string; label: string }[], fallback: string[][]) {
  return options.length ? options.map((option) => [option.value, option.label]) : fallback
}

export function MediaLibraryPage() {
  const [period, setPeriod] = useState('week')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<MarketingMediaAsset | null>(null)
  const [media, setMedia] = useState<MediaState>(() => transformMediaLibrary({}))
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingAssetEdit, setIsSavingAssetEdit] = useState(false)
  const [apiError, setApiError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { showToast } = useToast()

  const [form, setForm] = useState({
    title: '',
    division: 'real_estate',
    type: 'video',
    fileUrl: '',
    description: '',
    tags: '',
    status: 'active',
  })
  const [assetEditForm, setAssetEditForm] = useState({
    title: '',
    division: 'real_estate',
    type: 'other',
    fileUrl: '',
    description: '',
    status: 'active',
  })

  function setSelectedAssetForEdit(asset: MarketingMediaAsset) {
    setSelectedAsset(asset)
    setAssetEditForm({
      title: asset.title,
      division: asset.division,
      type: asset.assetType,
      fileUrl: asset.fileUrl,
      description: asset.description,
      status: asset.status,
    })
  }

  async function loadMediaAssets() {
    setIsLoading(true)
    setApiError('')
    try {
      const res = await marketingService.getMediaAssets({ limit: 48 })
      if (res.data) {
        setMedia(transformMediaLibrary(res.data))
      } else if (res.error) {
        setMedia(transformMediaLibrary({}))
        setApiError(parseApiError(res.error))
      }
    } catch (err) {
      setMedia(transformMediaLibrary({}))
      setApiError(parseApiError(err instanceof Error ? err.message : err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => void loadMediaAssets())
  }, [])

  async function openAsset(asset: MarketingMediaAsset) {
    if (!asset.id) {
      setSelectedAssetForEdit(asset)
      return
    }

    setSelectedAssetForEdit(asset)
    const res = await marketingService.getMediaAsset(asset.id)
    if (res.data) {
      setSelectedAssetForEdit(transformMediaAsset(res.data))
    } else if (res.error) {
      showToast(parseApiError(res.error), 'error')
    }
  }

  async function handleUpload() {
    if (!form.title.trim()) {
      showToast('Please enter asset title', 'error')
      return
    }
    if (!selectedFile && !form.fileUrl.trim()) {
      showToast('Please choose a file or enter an asset file URL', 'error')
      return
    }

    setIsSaving(true)
    try {
      let fileUrl = form.fileUrl.trim()
      let fileSize = 0
      let mimeType = ''
      if (selectedFile) {
        const uploadRes = await marketingService.uploadFile(selectedFile)
        if (!uploadRes.data?.url) {
          showToast(parseApiError(uploadRes.error || 'Could not upload file'), 'error')
          return
        }
        fileUrl = uploadRes.data.url
        fileSize = selectedFile.size
        mimeType = selectedFile.type
      }

      const res = await marketingService.createMediaAsset({
        title: form.title.trim(),
        asset_type: form.type,
        file_url: fileUrl,
        file_size_bytes: fileSize,
        mime_type: mimeType,
        division: form.division,
        description: form.description.trim() || null,
        tags: form.tags.trim() || null,
        status: form.status,
      })
      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not create media asset'), 'error')
        return
      }

      showToast(`Asset "${form.title}" created.`, 'success')
      setShowUploadModal(false)
      setSelectedFile(null)
      setForm({ title: '', division: 'real_estate', type: 'video', fileUrl: '', description: '', tags: '', status: 'active' })
      await loadMediaAssets()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpdateAsset() {
    if (!selectedAsset?.id) {
      showToast('This asset has no backend ID.', 'error')
      return
    }
    if (!assetEditForm.title.trim()) {
      showToast('Please enter asset title', 'error')
      return
    }

    setIsSavingAssetEdit(true)
    try {
      const res = await marketingService.updateMediaAsset(selectedAsset.id, {
        title: assetEditForm.title.trim(),
        asset_type: assetEditForm.type,
        file_url: assetEditForm.fileUrl.trim(),
        division: assetEditForm.division,
        description: assetEditForm.description.trim() || null,
        status: assetEditForm.status,
      })
      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not update media asset'), 'error')
        return
      }

      const updatedAsset = transformMediaAsset(res.data)
      setSelectedAssetForEdit(updatedAsset)
      showToast('Media asset updated.', 'success')
      await loadMediaAssets()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSavingAssetEdit(false)
    }
  }

  const summaryText = media.summary.storageUsed
    ? `${pluralize(media.summary.totalAssets, 'asset')} - ${media.summary.storageUsed} used`
    : pluralize(media.summary.totalAssets, 'asset')

  const [isExporting, setIsExporting] = useState(false)

  async function handleExportMedia() {
    setIsExporting(true)
    try {
      const res = await marketingService.exportMediaLibrary()
      if (res.error) {
        showToast(parseApiError(res.error), 'error')
        return
      }
      showToast('Media library exported.', 'success')
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-col overflow-x-hidden">
      <Topbar title="Media library" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-semibold text-text-3">{isLoading ? null : summaryText}</div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportMedia}
                disabled={isExporting}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-text shadow-xs transition-all hover:bg-surface-1 active:scale-95 disabled:opacity-60"
              >
                {isExporting ? <BusyLabel>Exporting...</BusyLabel> : <><AppIcon name="download" size={14} /> Export</>}
              </button>
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-navy px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-navy-dark active:scale-95"
              >
                <AppIcon name="upload" size={14} /> Upload asset
              </button>
            </div>
          </div>

          {apiError ? <ErrorState message={apiError} onRetry={loadMediaAssets} compact /> : null}

          {isLoading ? (
            <SkeletonKpiGrid />
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <SummaryCard label="Total assets" value={media.summary.totalAssets} />
              <SummaryCard label="Active" value={media.summary.activeAssets} />
              <SummaryCard label="Archived" value={media.summary.archivedAssets} />
              <SummaryCard label="Storage" value={media.summary.storageUsed || '0 B'} />
            </div>
          )}

          {media.summary.typeCounts.length > 0 && (
            <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-surface p-3 shadow-xs">
              {media.summary.typeCounts.map((item: { value: string; label: string; count: number }) => (
                <span key={item.value} className="rounded-full border border-border bg-surface-1 px-3 py-1 text-[11px] font-bold text-text-2">
                  {item.label}: {item.count}
                </span>
              ))}
            </div>
          )}

          {isLoading ? (
            <SkeletonCardGrid cards={8} className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" />
          ) : media.assets.length === 0 ? (
            <EmptyState title="No media assets" description="No media assets were returned." icon="ti-photo" />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {media.assets.map((asset) => (
                <button
                  key={String(asset.id || asset.title)}
                  type="button"
                  onClick={() => openAsset(asset)}
                  className="min-w-0 overflow-hidden rounded-2xl border border-border bg-surface text-left shadow-xs transition-all hover:border-navy"
                >
                  <div className={`flex h-28 items-center justify-center ${asset.bg} text-white`}>
                    {asset.thumbnailUrl ? (
                      <img src={asset.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <AppIcon name={asset.icon.replace(/^ti-/, '')} size={24} />
                    )}
                  </div>

                  <div className="space-y-1.5 p-3.5">
                    <h4 className="truncate text-xs font-bold text-text">{asset.title}</h4>
                    <div className="flex min-w-0 items-center gap-2 text-[10.5px] font-medium text-text-3">
                      <span className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 font-bold ${divCols[asset.division] || divCols.re}`}>
                        {asset.divisionLabel}
                      </span>
                      <span className="truncate">{asset.sizeLabel}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Media Asset" size="lg">
        <div className="space-y-4">
          <Field label="Asset Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} placeholder="e.g. Imperial Garden Estate Promo Video" />
          <div>
            <label className="mb-1 block text-xs font-bold text-text-2">File</label>
            <input
              type="file"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-text outline-none focus:border-navy"
            />
            {selectedFile && <div className="mt-1 truncate text-[10.5px] font-semibold text-text-3">{selectedFile.name}</div>}
          </div>
          <Field label="File URL" value={form.fileUrl} onChange={(value) => setForm({ ...form, fileUrl: value })} placeholder="https://..." />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectField label="Division" value={form.division} onChange={(value) => setForm({ ...form, division: value })} options={optionTuples(media.metadata.divisions, divisionOptions)} />
            <SelectField label="Asset Type" value={form.type} onChange={(value) => setForm({ ...form, type: value })} options={optionTuples(media.metadata.assetTypes, assetTypeOptions)} />
            <SelectField label="Status" value={form.status} onChange={(value) => setForm({ ...form, status: value })} options={optionTuples(media.metadata.statuses, statusOptions)} />
          </div>

          <TextAreaField label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
          <Field label="Tags" value={form.tags} onChange={(value) => setForm({ ...form, tags: value })} placeholder="campaign, estate, social" />

          <div className="flex justify-end gap-2 border-t border-border pt-2">
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-text hover:bg-surface-1"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={isSaving}
              className="rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy-dark disabled:opacity-50"
            >
              {isSaving ? <BusyLabel>Saving...</BusyLabel> : 'Create Asset'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!selectedAsset} onClose={() => setSelectedAsset(null)} title={selectedAsset?.title || 'Media Asset'}>
        {selectedAsset && (
          <div className="space-y-3 text-xs">
            <div className={`flex h-36 items-center justify-center overflow-hidden rounded-xl ${selectedAsset.bg} text-white`}>
              {selectedAsset.thumbnailUrl ? (
                <img src={selectedAsset.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <AppIcon name={selectedAsset.icon.replace(/^ti-/, '')} size={32} />
              )}
            </div>
            <Field label="Asset Title" value={assetEditForm.title} onChange={(value) => setAssetEditForm({ ...assetEditForm, title: value })} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SelectField label="Type" value={assetEditForm.type} onChange={(value) => setAssetEditForm({ ...assetEditForm, type: value })} options={optionTuples(media.metadata.assetTypes, assetTypeOptions)} />
              <SelectField label="Division" value={assetEditForm.division} onChange={(value) => setAssetEditForm({ ...assetEditForm, division: value })} options={optionTuples(media.metadata.divisions, divisionOptions)} />
              <SelectField label="Status" value={assetEditForm.status} onChange={(value) => setAssetEditForm({ ...assetEditForm, status: value })} options={optionTuples(media.metadata.statuses, statusOptions)} />
            </div>
            <Field label="File URL" value={assetEditForm.fileUrl} onChange={(value) => setAssetEditForm({ ...assetEditForm, fileUrl: value })} />
            <TextAreaField label="Description" value={assetEditForm.description} onChange={(value) => setAssetEditForm({ ...assetEditForm, description: value })} />
            <DetailRow label="Owner" value={selectedAsset.owner} />
            <DetailRow label="Size" value={selectedAsset.sizeLabel} />
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
              {selectedAsset.fileUrl && (
                <a href={selectedAsset.fileUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-xl border border-border px-3 py-2 text-xs font-bold text-text hover:bg-surface-1">
                  Open file
                </a>
              )}
              <button
                type="button"
                onClick={handleUpdateAsset}
                disabled={isSavingAssetEdit || !selectedAsset.id}
                className="rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy-dark disabled:opacity-50"
              >
                {isSavingAssetEdit ? <BusyLabel>Saving...</BusyLabel> : 'Save asset'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-text-2">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-text outline-none focus:border-navy" />
    </div>
  )
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-text-2">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full resize-none rounded-xl border border-border bg-surface p-2.5 text-xs text-text outline-none focus:border-navy" />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-text-2">{label}</label>
      <Select
        options={options.map(([val, lbl]) => ({ value: val, label: lbl }))}
        value={value}
        onChange={onChange}
        className="w-full"
      />
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3 shadow-xs">
      <div className="text-[11px] font-bold uppercase text-text-3">{label}</div>
      <div className="mt-1 text-xl font-extrabold text-text">{value}</div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-2">
      <span className="font-bold text-text-3">{label}</span>
      <span className="min-w-0 break-words text-right font-semibold text-text">{value}</span>
    </div>
  )
}
