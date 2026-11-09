import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CampaignPublicPagePanel } from './CampaignPublicPagePanel'
import { marketingService } from '../../../services/api/marketingService'

vi.mock('../../../context/ToastContext', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))

vi.mock('../../../services/api/marketingService', () => ({
  marketingService: {
    getCampaignPublicPage: vi.fn(),
    deleteCampaignPublicPage: vi.fn(),
    getLeadCaptureForms: vi.fn(),
    createLeadCaptureForm: vi.fn(),
    updateLeadCaptureForm: vi.fn(),
    getLeadCaptureSubmissions: vi.fn(),
    getMediaAssets: vi.fn(),
  },
}))

const mockedService = vi.mocked(marketingService)

const form = {
  id: 5,
  campaign_id: 7,
  campaign_name: 'Fortress City Estate',
  name: 'Fortress City Qualification',
  public_key: 'public-fortress-key',
  source: 'website_form',
  status: 'draft',
  questions: [],
  created_by_id: 2,
  created_at: '2026-11-06T10:00:00Z',
  updated_at: '2026-11-06T10:00:00Z',
}

const page = {
  slug: 'fortress-city',
  eyebrow: 'Fortress City Estate',
  headline: 'A strong start for your dream home',
  subheadline: 'A 500 sqm plot with a promotional offer.',
  description: 'Enquire about Fortress City Estate.',
  location: 'Emene, Enugu',
  plot_size_sqm: 500,
  standard_price: '10000000.00',
  promotion_price: '7500000.00',
  promotion_limit: 10,
  bonus_blocks: 100,
  bonus_text: '100 free building blocks with every plot purchase',
  hero_image_url: '',
  social_title: 'Fortress City Estate',
  social_description: 'A property offer in Emene.',
  social_image_url: '',
  contact_phone: '+234 803 665 6173',
  contact_whatsapp: '+2348036656173',
  proximity: [],
  features: [],
  claims_verified: false,
  published: false,
}

describe('CampaignPublicPagePanel', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockedService.getCampaignPublicPage.mockResolvedValue({ status: 404, error: 'Not found' })
    mockedService.deleteCampaignPublicPage.mockResolvedValue({ status: 200, data: { detail: 'Deleted' } })
    mockedService.getLeadCaptureForms.mockResolvedValue({ status: 200, data: [] })
    mockedService.createLeadCaptureForm.mockResolvedValue({ status: 201, data: form })
    mockedService.updateLeadCaptureForm.mockResolvedValue({ status: 200, data: { ...form, status: 'active' } })
    mockedService.getLeadCaptureSubmissions.mockResolvedValue({ status: 200, data: { count: 0, items: [] } })
    mockedService.getMediaAssets.mockResolvedValue({
      status: 200,
      data: { assets: [{ id: 3, title: 'Fortress artwork', asset_type: 'image', file_url: 'https://media.example/fortress.jpg' }] },
    })
  })

  afterEach(() => cleanup())

  it('creates the approved qualification form with contact preference, five topics, and required consent', async () => {
    render(<CampaignPublicPagePanel campaignId={7} campaignName="Fortress City Estate" campaignStatus="active" />)

    await screen.findByRole('tab', { name: 'Lead form' })
    fireEvent.click(screen.getByRole('tab', { name: 'Lead form' }))
    fireEvent.click(screen.getByRole('button', { name: 'Create qualification form' }))

    await waitFor(() => expect(mockedService.createLeadCaptureForm).toHaveBeenCalledTimes(1))
    const payload = mockedService.createLeadCaptureForm.mock.calls[0][1]
    expect(payload.status).toBe('draft')
    expect(payload.questions.filter((question) => question.key !== 'preferred_contact_method' && question.key !== 'contact_consent')).toHaveLength(5)
    expect(payload.questions.find((question) => question.key === 'preferred_contact_method')?.required).toBe(true)
    expect(payload.questions.find((question) => question.key === 'contact_consent')).toMatchObject({ field_type: 'checkbox', required: true })
    expect(await screen.findByText('Public form key:')).toBeInTheDocument()
  })

  it('starts new campaign pages with the approved estate description and details', async () => {
    render(<CampaignPublicPagePanel campaignId={7} campaignName="Fortress City Estate" campaignStatus="active" />)

    expect((await screen.findByLabelText('Campaign description') as HTMLTextAreaElement).value).toContain('residential development in Emene, Enugu')
    expect((screen.getByLabelText('Nearby landmarks (one per line)') as HTMLTextAreaElement).value).toContain('7 minutes from Eke Obiagu')
    const features = (screen.getByLabelText('Estate features (one per line)') as HTMLTextAreaElement).value
    expect(features).toContain('Title: R of O')
    expect(features).toContain('Secure community')
  })

  it('reviews captured enquiries and flags possible duplicates', async () => {
    mockedService.getCampaignPublicPage.mockResolvedValue({ status: 200, data: { ...page, id: 9, lead_form_id: 5 } })
    mockedService.getLeadCaptureForms.mockResolvedValue({ status: 200, data: [{ ...form, questions: [] }] })
    mockedService.getLeadCaptureSubmissions.mockResolvedValue({
      status: 200,
      data: {
        count: 1,
        items: [{
          id: 11,
          form_id: 5,
          form_name: form.name,
          lead_id: 21,
          full_name: 'Ada Example',
          phone: '+2348000000000',
          email: '',
          location: 'Enugu',
          status: 'new',
          answers: { contact_consent: true },
          possible_duplicate_of: 8,
          submitted_at: '2026-11-06T10:00:00Z',
        }],
      },
    })

    render(<CampaignPublicPagePanel campaignId={7} campaignName="Fortress City Estate" campaignStatus="active" />)
    fireEvent.click(await screen.findByRole('tab', { name: 'Enquiries' }))

    expect(await screen.findByText('Ada Example')).toBeInTheDocument()
    expect(screen.getByText('Possible duplicate')).toBeInTheDocument()
    expect(mockedService.getLeadCaptureSubmissions).toHaveBeenCalledWith(7, '5', { limit: 20, offset: 0 })
  })

  it('activates the selected form through the campaign form controls', async () => {
    mockedService.getCampaignPublicPage.mockResolvedValue({ status: 200, data: { ...page, id: 9, lead_form_id: 5 } })
    mockedService.getLeadCaptureForms.mockResolvedValue({ status: 200, data: [{ ...form, questions: [] }] })
    render(<CampaignPublicPagePanel campaignId={7} campaignName="Fortress City Estate" campaignStatus="active" />)

    fireEvent.click(await screen.findByRole('tab', { name: 'Lead form' }))
    fireEvent.change(await screen.findByRole('combobox', { name: 'Lead form status' }), { target: { value: 'active' } })

    await waitFor(() => expect(mockedService.updateLeadCaptureForm).toHaveBeenCalledWith(7, 5, { status: 'active' }))
  })

  it('selects campaign artwork from the Marketing media library', async () => {
    mockedService.getCampaignPublicPage.mockResolvedValue({ status: 200, data: { ...page, id: 9 } })
    render(<CampaignPublicPagePanel campaignId={7} campaignName="Fortress City Estate" campaignStatus="active" />)

    fireEvent.click(await screen.findByRole('button', { name: 'Choose media' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Fortress artwork' }))

    expect(screen.getByLabelText('Hero image URL')).toHaveValue('https://media.example/fortress.jpg')
    expect(screen.getByLabelText('Social share image URL')).toHaveValue('https://media.example/fortress.jpg')
  })

  it('deletes the public page without deleting its campaign or lead form', async () => {
    mockedService.getCampaignPublicPage.mockResolvedValue({ status: 200, data: { ...page, id: 9 } })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<CampaignPublicPagePanel campaignId={7} campaignName="Fortress City Estate" campaignStatus="active" />)

    fireEvent.click(await screen.findByRole('button', { name: 'Delete page' }))

    await waitFor(() => expect(mockedService.deleteCampaignPublicPage).toHaveBeenCalledWith(7))
    expect(await screen.findByRole('button', { name: 'Create page draft' })).toBeInTheDocument()
  })
})
