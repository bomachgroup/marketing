import { useEffect, useState } from 'react'
import { BusyLabel, EmptyState, ErrorState } from '../../shared'
import { AppIcon } from '../../shared/AppIcon'
import { useToast } from '../../../context/ToastContext'
import {
  marketingService,
  type BackendCampaignPage,
  type BackendLeadCaptureForm,
  type BackendLeadCaptureQuestion,
  type BackendLeadCaptureSubmission,
} from '../../../services/api/marketingService'
import { parseApiError } from '../../../services/api/apiClient'
import { transformMediaLibrary } from '../../../services/transformers/marketingTransformers'

type PageTab = 'page' | 'form' | 'submissions'

const DEFAULT_PAGE: BackendCampaignPage = {
  slug: 'fortress-city',
  eyebrow: 'Fortress City Estate · Emene, Enugu',
  headline: 'Your dream home deserves a strong start',
  subheadline: 'Own a 500 sqm plot and receive 100 free building blocks with every purchase.',
  description: [
    'Fortress City Estate is a residential development in Emene, Enugu, offering 500 sqm plots.',
    'The campaign materials list the title as R of O. The estate is described as ready to build, with perimeter fencing, a good road network and drainage, electricity infrastructure, and a secure community.',
    'Nearby points listed are Peace Land Medical College (5 minutes), Eke Obiagu (7 minutes), Coal City (9 minutes), and Enugu Airport (15 minutes). Peaceland University, Satellite Estate, and Vanguard City Estate are also listed nearby.',
  ].join('\n\n'),
  location: 'Emene, Enugu',
  plot_size_sqm: 500,
  standard_price: '10000000.00',
  promotion_price: '7500000.00',
  promotion_limit: 10,
  bonus_blocks: 100,
  bonus_text: '100 free building blocks with every plot purchase',
  hero_image_url: '',
  social_title: 'Fortress City Estate, Emene',
  social_description: 'Secure a 500 sqm plot in Emene, Enugu, with a limited-time promotional price.',
  social_image_url: '',
  contact_phone: '+234 803 665 6173',
  contact_whatsapp: '+2348036656173',
  proximity: [
    '5 minutes from Peace Land Medical College',
    '7 minutes from Eke Obiagu',
    '9 minutes from Coal City',
    '15 minutes from Enugu Airport',
    'Nearby: Peaceland University, Satellite Estate, and Vanguard City Estate',
  ],
  features: [
    'Title: R of O',
    'Ready to build',
    'Perimeter fencing',
    'Good road network and drainage',
    'Electricity infrastructure',
    'Secure community',
  ],
  claims_verified: false,
  published: false,
}

const QUESTION_TEMPLATE: BackendLeadCaptureQuestion[] = [
  {
    key: 'preferred_contact_method',
    label: 'How should we contact you?',
    field_type: 'select',
    required: true,
    options: ['Call', 'WhatsApp', 'Email'],
    sort_order: 0,
    is_active: true,
  },
  {
    key: 'purchase_reason',
    label: 'What is your primary reason for considering Fortress City Estate?',
    field_type: 'select',
    required: true,
    options: ['To build my personal home', 'For real estate investment', 'To build rental properties', 'Still exploring my options'],
    sort_order: 1,
    is_active: true,
  },
  {
    key: 'purchase_timeline',
    label: 'How soon are you planning to secure a property?',
    field_type: 'select',
    required: true,
    options: ['Immediately', 'Within 1 month', 'Within 3 months', 'Just making enquiries'],
    sort_order: 2,
    is_active: true,
  },
  {
    key: 'budget_fit',
    label: 'Does the ₦7.5 million promotional price fit your budget?',
    field_type: 'select',
    required: true,
    options: ['Yes, I am ready to proceed', 'Yes, but I prefer instalment payments', 'I need more information before deciding', 'It is above my current budget'],
    sort_order: 3,
    is_active: true,
  },
  {
    key: 'payment_preference',
    label: 'How would you prefer to make payment?',
    field_type: 'select',
    required: true,
    options: ['Outright payment', 'Instalment payment (if available)', 'I would like to discuss payment options'],
    sort_order: 4,
    is_active: true,
  },
  {
    key: 'site_inspection',
    label: 'Would you be available for a site inspection at Fortress City Estate, Emene?',
    field_type: 'select',
    required: true,
    options: ['Yes, this week', 'Yes, next week', 'I prefer a virtual inspection first', 'Not yet'],
    sort_order: 5,
    is_active: true,
  },
  {
    key: 'contact_consent',
    label: 'I agree to be contacted about this property enquiry and follow-up.',
    field_type: 'checkbox',
    required: true,
    options: [],
    sort_order: 6,
    is_active: true,
  },
]

function lineValues(value: string[]) {
  return value.join('\n')
}

function parseLines(value: string) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean)
}

function formatSubmittedAt(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

export function CampaignPublicPagePanel({ campaignId, campaignName, campaignStatus }: {
  campaignId: string | number
  campaignName: string
  campaignStatus: string
}) {
  const [tab, setTab] = useState<PageTab>('page')
  const [page, setPage] = useState<BackendCampaignPage>({ ...DEFAULT_PAGE })
  const [hasPage, setHasPage] = useState(false)
  const [forms, setForms] = useState<BackendLeadCaptureForm[]>([])
  const [selectedFormId, setSelectedFormId] = useState('')
  const [submissions, setSubmissions] = useState<BackendLeadCaptureSubmission[]>([])
  const [submissionCount, setSubmissionCount] = useState(0)
  const [pageLoading, setPageLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(true)
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [mediaOpen, setMediaOpen] = useState(false)
  const [mediaLoading, setMediaLoading] = useState(false)
  const [mediaItems, setMediaItems] = useState<Array<{ id?: string | number; title: string; fileUrl: string; thumbnailUrl: string }>>([])
  const { showToast } = useToast()

  useEffect(() => {
    let cancelled = false
    async function load() {
      setPageLoading(true)
      setFormLoading(true)
      setError('')
      const [pageResult, formsResult] = await Promise.all([
        marketingService.getCampaignPublicPage(campaignId),
        marketingService.getLeadCaptureForms(campaignId),
      ])
      if (cancelled) return
      if (pageResult.data) {
        const data = pageResult.data as BackendCampaignPage
        setPage(data)
        setHasPage(true)
        if (data.lead_form_id) setSelectedFormId(String(data.lead_form_id))
      } else if (pageResult.status !== 404) {
        setError(parseApiError(pageResult.error || 'Could not load public page settings.'))
      }
      if (formsResult.data) {
        const rows = Array.isArray(formsResult.data) ? formsResult.data : []
        setForms(rows)
        if (pageResult.data && (pageResult.data as BackendCampaignPage).lead_form_id) {
          setSelectedFormId(String((pageResult.data as BackendCampaignPage).lead_form_id))
        } else if (rows[0]) {
          setSelectedFormId(String(rows[0].id))
        }
      } else {
        setError((current) => current || parseApiError(formsResult.error || 'Could not load lead forms.'))
      }
      setPageLoading(false)
      setFormLoading(false)
    }
    void load()
    return () => { cancelled = true }
  }, [campaignId])

  async function loadSubmissions(formId = selectedFormId) {
    if (!formId) return
    setSubmissionsLoading(true)
    const result = await marketingService.getLeadCaptureSubmissions(campaignId, formId, { limit: 20, offset: 0 })
    if (result.data) {
      setSubmissions(result.data.items || [])
      setSubmissionCount(result.data.count || 0)
    } else {
      showToast(parseApiError(result.error || 'Could not load enquiries.'), 'error')
    }
    setSubmissionsLoading(false)
  }

  async function openMediaLibrary() {
    setMediaOpen((open) => !open)
    if (mediaItems.length) return
    setMediaLoading(true)
    const result = await marketingService.getMediaAssets({ asset_type: 'image', status: 'active', limit: 48 })
    if (result.data) {
      const assets = transformMediaLibrary(result.data).assets
      setMediaItems(assets.map((asset) => ({ id: asset.id, title: asset.title, fileUrl: asset.fileUrl, thumbnailUrl: asset.thumbnailUrl })))
    } else {
      showToast(parseApiError(result.error || 'Could not load the media library.'), 'error')
    }
    setMediaLoading(false)
  }

  async function createQualificationForm() {
    setSaving(true)
    const result = await marketingService.createLeadCaptureForm(campaignId, {
      name: `${campaignName} Qualification Form`,
      source: 'website_form',
      status: 'draft',
      questions: QUESTION_TEMPLATE,
    })
    if (result.data) {
      setForms((current) => [result.data as BackendLeadCaptureForm, ...current])
      setSelectedFormId(String((result.data as BackendLeadCaptureForm).id))
      setPage((current) => ({ ...current, lead_form_id: (result.data as BackendLeadCaptureForm).id }))
      showToast('Qualification form created as a draft.', 'success')
      setTab('form')
    } else {
      showToast(parseApiError(result.error || 'Could not create the form.'), 'error')
    }
    setSaving(false)
  }

  async function updateForm(payload: { name?: string; status?: string }) {
    const form = forms.find((item) => String(item.id) === selectedFormId)
    if (!form) return
    setSaving(true)
    const result = await marketingService.updateLeadCaptureForm(campaignId, form.id, payload)
    if (result.data) {
      const updated = result.data as BackendLeadCaptureForm
      setForms((current) => current.map((item) => item.id === updated.id ? updated : item))
      showToast('Lead form updated.', 'success')
    } else {
      showToast(parseApiError(result.error || 'Could not update the form.'), 'error')
    }
    setSaving(false)
  }

  async function savePage() {
    if (!page.headline.trim() || !page.slug.trim()) {
      showToast('Enter a page title and URL slug.', 'error')
      return
    }
    setSaving(true)
    const payload = { ...page, lead_form_id: selectedFormId ? Number(selectedFormId) : null }
    const result = hasPage
      ? await marketingService.updateCampaignPublicPage(campaignId, payload)
      : await marketingService.createCampaignPublicPage(campaignId, payload)
    if (result.data) {
      setPage(result.data as BackendCampaignPage)
      setHasPage(true)
      showToast(page.published ? 'Public campaign page saved and published.' : 'Public campaign page saved as a draft.', 'success')
    } else {
      showToast(parseApiError(result.error || 'Could not save the public page.'), 'error')
    }
    setSaving(false)
  }

  async function togglePublished() {
    if (!hasPage) {
      showToast('Save the page as a draft before publishing.', 'error')
      return
    }
    if (page.published && !window.confirm('Unpublish this campaign page?')) return
    if (!page.published && campaignStatus !== 'active') {
      showToast('Set the Marketing campaign to Active before publishing its page.', 'error')
      return
    }
    if (!page.published && !page.claims_verified) {
      showToast('Verify the property and location claims before publishing.', 'error')
      return
    }
    setSaving(true)
    const nextPublished = !page.published
    const result = await marketingService.updateCampaignPublicPage(campaignId, {
      published: nextPublished,
      lead_form_id: selectedFormId ? Number(selectedFormId) : null,
    })
    if (result.data) {
      setPage(result.data as BackendCampaignPage)
      showToast(nextPublished ? 'Campaign page is now live.' : 'Campaign page unpublished.', 'success')
    } else {
      showToast(parseApiError(result.error || 'Could not update publication status.'), 'error')
    }
    setSaving(false)
  }

  async function deletePage() {
    if (!hasPage || !window.confirm('Delete this public campaign page? The Marketing campaign and its lead form will remain.')) return
    setSaving(true)
    const result = await marketingService.deleteCampaignPublicPage(campaignId)
    if (result.data) {
      setPage({ ...DEFAULT_PAGE })
      setHasPage(false)
      setSelectedFormId('')
      showToast('Public campaign page deleted.', 'success')
    } else {
      showToast(parseApiError(result.error || 'Could not delete the public page.'), 'error')
    }
    setSaving(false)
  }

  const selectedForm = forms.find((item) => String(item.id) === selectedFormId)
  const pageInput = (key: keyof BackendCampaignPage, value: string | number) => setPage((current) => ({ ...current, [key]: value }))

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-surface-1 p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy">Public campaign</div>
          <h3 className="mt-1 text-sm font-bold text-text">Landing page & enquiries</h3>
          <p className="mt-1 text-[11px] text-text-3">Manage the campaign page, qualification form, and captured leads.</p>
        </div>
        <a href={`https://bomachgroup.com/promotions/${page.slug || 'fortress-city'}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface px-3 py-2 text-[11px] font-bold text-text hover:bg-surface-2">
          Preview page <AppIcon name="external-link" size={13} />
        </a>
      </div>

      {error && <ErrorState message={error} compact />}

      <div className="flex flex-wrap gap-1 border-b border-border/80 pb-2" role="tablist" aria-label="Campaign public page tools">
        {([
          ['page', 'Page content'],
          ['form', 'Lead form'],
          ['submissions', `Enquiries${submissionCount ? ` (${submissionCount})` : ''}`],
        ] as [PageTab, string][]).map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => { setTab(value); if (value === 'submissions') void loadSubmissions() }} className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors ${tab === value ? 'bg-navy text-white' : 'text-text-3 hover:bg-surface hover:text-text'}`}>
            {label}
          </button>
        ))}
      </div>

      {(pageLoading || formLoading) && <div className="py-4 text-xs text-text-3"><BusyLabel>Loading public campaign settings...</BusyLabel></div>}

      {!pageLoading && tab === 'page' && (
        <fieldset disabled={saving || !!error} className="space-y-3 disabled:opacity-60">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface p-3">
            <div>
              <div className="text-xs font-bold text-text">Publication</div>
              <p className="mt-0.5 text-[10.5px] text-text-3">A live page needs an active campaign and an active linked form.</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${page.published ? 'bg-emerald-50 text-emerald-800' : 'bg-surface-2 text-text-3'}`}>{page.published ? 'Published' : 'Draft'}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2">
            <TextField label="URL slug" value={page.slug} onChange={(value) => pageInput('slug', value)} />
            <TextField label="Campaign eyebrow" value={page.eyebrow} onChange={(value) => pageInput('eyebrow', value)} />
          </div>
          <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2">
            <TextField label="Headline" value={page.headline} onChange={(value) => pageInput('headline', value)} />
            <TextField label="Subheadline" value={page.subheadline} onChange={(value) => pageInput('subheadline', value)} />
          </div>
          <TextArea label="Campaign description" value={page.description} onChange={(value) => pageInput('description', value)} />
          <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 min-[1100px]:grid-cols-3">
            <TextField label="Location" value={page.location} onChange={(value) => pageInput('location', value)} />
            <TextField label="Plot size (sqm)" type="number" value={page.plot_size_sqm} onChange={(value) => pageInput('plot_size_sqm', Number(value))} />
            <TextField label="Promo plots limit" type="number" value={page.promotion_limit} onChange={(value) => pageInput('promotion_limit', Number(value))} />
          </div>
          <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 min-[1100px]:grid-cols-3">
            <TextField label="Standard price (NGN)" type="number" value={page.standard_price} onChange={(value) => pageInput('standard_price', value)} />
            <TextField label="Promotion price (NGN)" type="number" value={page.promotion_price} onChange={(value) => pageInput('promotion_price', value)} />
            <TextField label="Free blocks" type="number" value={page.bonus_blocks} onChange={(value) => pageInput('bonus_blocks', Number(value))} />
          </div>
          <TextField label="Bonus offer" value={page.bonus_text} onChange={(value) => pageInput('bonus_text', value)} />
          <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2">
            <TextField label="Contact phone" value={page.contact_phone} onChange={(value) => pageInput('contact_phone', value)} />
            <TextField label="WhatsApp number" value={page.contact_whatsapp} onChange={(value) => pageInput('contact_whatsapp', value)} />
          </div>
          <div className="grid grid-cols-1 gap-3 min-[760px]:grid-cols-2">
            <TextArea label="Nearby landmarks (one per line)" value={lineValues(page.proximity || [])} onChange={(value) => setPage((current) => ({ ...current, proximity: parseLines(value) }))} />
            <TextArea label="Estate features (one per line)" value={lineValues(page.features || [])} onChange={(value) => setPage((current) => ({ ...current, features: parseLines(value) }))} />
          </div>

          <div className="space-y-2 rounded-xl border border-border bg-surface p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-text">Campaign artwork</div>
                <p className="mt-0.5 text-[10px] text-text-3">Choose an image already stored in the Marketing media library.</p>
              </div>
              <button type="button" onClick={openMediaLibrary} className="rounded-lg border border-border px-3 py-1.5 text-[10.5px] font-bold text-text hover:bg-surface-1">{mediaOpen ? 'Hide media' : 'Choose media'}</button>
            </div>
            <TextField label="Hero image URL" value={page.hero_image_url} onChange={(value) => pageInput('hero_image_url', value)} />
            <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2">
              <TextField label="Social share title" value={page.social_title} onChange={(value) => pageInput('social_title', value)} />
              <TextField label="Social share image URL" value={page.social_image_url} onChange={(value) => pageInput('social_image_url', value)} />
            </div>
            <TextArea label="Social share description" value={page.social_description} onChange={(value) => pageInput('social_description', value)} />
            {mediaOpen && (
              <div className="rounded-xl border border-border bg-surface-1 p-3">
                {mediaLoading ? <BusyLabel>Loading image library...</BusyLabel> : mediaItems.length === 0 ? (
                  <EmptyState title="No active image assets" description="Upload the campaign artwork to the Media Library, then select it here." icon="ti-photo" compact />
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {mediaItems.map((asset) => (
                      <button key={String(asset.id || asset.fileUrl)} type="button" onClick={() => { setPage((current) => ({ ...current, hero_image_url: asset.fileUrl, social_image_url: asset.fileUrl })); setMediaOpen(false) }} className="overflow-hidden rounded-lg border border-border bg-surface text-left hover:border-navy">
                        {asset.thumbnailUrl || asset.fileUrl ? <img src={asset.thumbnailUrl || asset.fileUrl} alt="" className="h-20 w-full object-cover" /> : <div className="flex h-20 items-center justify-center text-text-3"><AppIcon name="photo" size={20} /></div>}
                        <span className="block truncate px-2 py-1.5 text-[10px] font-semibold text-text">{asset.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-text-2">Public qualification form</label>
            <select value={selectedFormId} onChange={(event) => setSelectedFormId(event.target.value)} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs text-text">
              <option value="">Select a form</option>
              {forms.map((form) => <option key={form.id} value={form.id}>{form.name} · {form.status}</option>)}
            </select>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10.5px] leading-relaxed text-amber-950">
            <input type="checkbox" checked={page.claims_verified} onChange={(event) => setPage((current) => ({ ...current, claims_verified: event.target.checked }))} className="mt-0.5 h-4 w-4 shrink-0 accent-amber-700" />
            <span><strong>Verify before publishing.</strong> I have checked title status, travel-time estimates, fencing, road access, electricity, and ready-to-build claims against approved estate documents.</span>
          </label>
          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
            {hasPage && <button type="button" onClick={() => void deletePage()} disabled={saving} className="mr-auto rounded-xl border border-red-200 bg-white px-3 py-2 text-[11px] font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">Delete page</button>}
            {hasPage && <button type="button" onClick={togglePublished} disabled={saving} className="rounded-xl border border-border bg-surface px-3 py-2 text-[11px] font-bold text-text hover:bg-surface-2 disabled:opacity-50">{saving ? 'Saving...' : page.published ? 'Unpublish' : 'Publish page'}</button>}
            <button type="button" onClick={savePage} disabled={saving || !!error} className="rounded-xl bg-navy px-4 py-2 text-[11px] font-bold text-white hover:bg-navy-dark disabled:opacity-50">{saving ? <BusyLabel>Saving...</BusyLabel> : hasPage ? 'Save page' : 'Create page draft'}</button>
          </div>
        </fieldset>
      )}

      {!pageLoading && tab === 'form' && (
        <div className="space-y-3">
          {!forms.length ? (
            <div className="rounded-xl border border-dashed border-border bg-surface p-5 text-center">
              <div className="text-xs font-bold text-text">No qualification form yet</div>
              <p className="mt-1 text-[11px] text-text-3">Create the form using the approved Fortress City qualification questions.</p>
              <button type="button" onClick={createQualificationForm} disabled={saving} className="mt-3 rounded-xl bg-navy px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">{saving ? <BusyLabel>Creating...</BusyLabel> : 'Create qualification form'}</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-[minmax(0,1fr)_auto] min-[520px]:items-end">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-text-2">Form</label>
                  <select value={selectedFormId} onChange={(event) => setSelectedFormId(event.target.value)} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs text-text">
                    {forms.map((form) => <option key={form.id} value={form.id}>{form.name} · {form.status}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${selectedForm?.status === 'active' ? 'bg-emerald-50 text-emerald-800' : 'bg-surface-2 text-text-3'}`}>{selectedForm?.status || 'Draft'}</span>
                  <select aria-label="Lead form status" value={selectedForm?.status || 'draft'} onChange={(event) => void updateForm({ status: event.target.value })} disabled={!selectedForm || saving || (campaignStatus !== 'active' && selectedForm?.status !== 'active')} className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text disabled:opacity-50">
                    <option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option><option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              {campaignStatus !== 'active' && <p className="rounded-lg bg-amber-50 px-3 py-2 text-[10.5px] text-amber-900">Set the campaign to Active before activating its public form.</p>}
              {selectedForm && <div className="space-y-2 rounded-xl border border-border bg-surface p-3">
                <div className="flex flex-wrap items-center justify-between gap-2"><div className="text-xs font-bold text-text">Form questions <span className="font-medium text-text-3">({selectedForm.questions.length})</span></div><button type="button" onClick={() => void createQualificationForm()} disabled={saving} className="text-[10px] font-bold text-navy hover:underline">Add another form</button></div>
                {selectedForm.questions.map((question) => <div key={question.key} className="rounded-lg bg-surface-1 px-3 py-2"><div className="text-[10.5px] font-semibold text-text">{question.label}{question.required ? <span className="text-red-600"> *</span> : null}</div><div className="mt-0.5 text-[9.5px] text-text-3">{question.field_type}{question.options?.length ? ` · ${question.options.map((option) => typeof option === 'string' ? option : option.label).join(', ')}` : ''}</div></div>)}
                <div className="break-all rounded-lg border border-border bg-surface-1 px-3 py-2 text-[10px] text-text-3">Public form key: <span className="font-mono text-text">{selectedForm.public_key}</span></div>
              </div>}
              <p className="text-[10.5px] leading-relaxed text-text-3">The form captures full name, phone, optional email, current location, preferred contact method, the five property-readiness questions, and required contact consent.</p>
            </>
          )}
        </div>
      )}

      {!pageLoading && tab === 'submissions' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-bold text-text">Captured enquiries <span className="font-medium text-text-3">{submissionCount}</span></div>
            <div className="flex items-center gap-2">
              <select value={selectedFormId} onChange={(event) => { setSelectedFormId(event.target.value); void loadSubmissions(event.target.value) }} className="max-w-[240px] rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[10.5px] text-text">
                {forms.map((form) => <option key={form.id} value={form.id}>{form.name}</option>)}
              </select>
              <button type="button" onClick={() => void loadSubmissions()} disabled={submissionsLoading || !selectedFormId} className="rounded-lg border border-border px-2.5 py-1.5 text-[10.5px] font-bold text-text disabled:opacity-50"><AppIcon name="refresh" size={13} /></button>
            </div>
          </div>
          {submissionsLoading ? <div className="py-4 text-xs text-text-3"><BusyLabel>Loading enquiries...</BusyLabel></div> : submissions.length === 0 ? (
            <EmptyState title="No enquiries yet" description="New public form submissions for this campaign will appear here." icon="ti-user-plus" compact />
          ) : submissions.map((submission) => (
            <article key={submission.id} className="rounded-xl border border-border bg-surface p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><div className="text-xs font-bold text-text">{submission.full_name}</div><div className="mt-0.5 text-[10.5px] text-text-3">{submission.phone}{submission.email ? ` · ${submission.email}` : ''} · {submission.location}</div></div>
                <div className="flex items-center gap-2"><span className="rounded-full bg-surface-2 px-2 py-1 text-[9.5px] font-bold text-text-2">{submission.status}</span>{submission.possible_duplicate_of && <span className="rounded-full bg-amber-50 px-2 py-1 text-[9.5px] font-bold text-amber-900">Possible duplicate</span>}</div>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                {Object.entries(submission.answers || {}).map(([key, value]) => <div key={key} className="rounded-lg bg-surface-1 px-2.5 py-2 text-[10px] text-text-2"><span className="font-bold">{selectedForm?.questions.find((question) => question.key === key)?.label || key}:</span> {typeof value === 'boolean' ? value ? 'Yes' : 'No' : Array.isArray(value) ? value.join(', ') : String(value ?? '—')}</div>)}
              </div>
              <div className="mt-2 text-[9.5px] text-text-3">Submitted {formatSubmittedAt(submission.submitted_at)} · Lead #{submission.lead_id}</div>
            </article>
          ))}
          {submissionCount > submissions.length && <p className="text-center text-[10px] text-text-3">Showing the latest {submissions.length} of {submissionCount} submissions.</p>}
        </div>
      )}
    </section>
  )
}

function TextField({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) {
  return <label className="block min-w-0"><span className="mb-1 block text-[10.5px] font-bold text-text-2">{label}</span><input type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs text-text outline-none focus:border-navy" /></label>
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block min-w-0"><span className="mb-1 block text-[10.5px] font-bold text-text-2">{label}</span><textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} className="w-full resize-y rounded-xl border border-border bg-surface px-3 py-2.5 text-xs text-text outline-none focus:border-navy" /></label>
}
