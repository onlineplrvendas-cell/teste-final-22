import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Contact, WeeklyConfirmationReport } from '../src/types';
import { getWeekRangeForDate } from '../src/utils/date';

const mocks = vi.hoisted(() => ({ crm: {} as any, currentUser: null as any }));
vi.mock('../src/context/CRMContext', () => ({ useCRM: () => mocks.crm }));
vi.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ currentUser: mocks.currentUser }) }));

import { ConfirmadosSemanaPage } from '../src/pages/ConfirmadosSemanaPage';

const week = getWeekRangeForDate();
const contact = (confirmed = false): Contact => ({
  id: 'contact-1', name: 'Ana Silva', phone: '(21) 99999-8888', normalizedPhone: '5521999998888',
  congregation: 'Recreio', category: 'Visitante', stage: 'Aguardando primeiro contato', source: 'Culto',
  isArchived: false, createdBy: 'admin', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  confirmedThisWeek: confirmed, confirmedWeekKey: confirmed ? week.weekKey : undefined,
});
const report = (status: 'confirmed' | 'unconfirmed' = 'unconfirmed'): WeeklyConfirmationReport => ({
  id: `report-${week.weekKey}-Recreio`, weekKey: week.weekKey, weekLabel: week.weekLabel,
  startDate: week.startDate, endDate: week.endDate, congregation: 'Recreio',
  entries: [{
    contactId: 'contact-1', name: 'Ana Silva', phone: '(21) 99999-8888', congregation: 'Recreio',
    category: 'Visitante', status, updatedAt: '2026-01-01',
  }],
  summary: { total: 1, confirmed: status === 'confirmed' ? 1 : 0, unconfirmed: status === 'unconfirmed' ? 1 : 0,
    confirmationRate: status === 'confirmed' ? 100 : 0,
    byCategory: { membros: 0, visitantes: 1, convidados: 0 }, topReasons: [] },
  savedAt: '2026-01-01',
});

function renderPage(
  currentContact: Contact,
  savedStatus: 'confirmed' | 'unconfirmed' = 'unconfirmed',
  savedReport = report(savedStatus),
) {
  mocks.crm = {
    contacts: [currentContact], teamMembers: [], selectedCongregation: 'Recreio',
    setSelectedCongregation: vi.fn(), authorizedCongregations: ['Recreio'],
    weeklyReports: [savedReport], saveWeeklyReport: vi.fn().mockResolvedValue(undefined),
    deleteWeeklyReport: vi.fn(), updateContact: vi.fn().mockResolvedValue(undefined),
  };
  mocks.currentUser = { uid: 'admin', name: 'Admin', role: 'admin' };
  return render(<ConfirmadosSemanaPage />);
}

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('ConfirmadosSemanaPage', () => {
  it('mantém a linha no relatório ao alternar o status e não grava no contato no clique', async () => {
    renderPage(contact(false));
    await screen.findAllByText('Ana Silva');

    fireEvent.click(screen.getAllByRole('button', { name: 'Confirmado' })[0]);

    expect(screen.getAllByText('Ana Silva').length).toBeGreaterThan(0);
    expect(mocks.crm.updateContact).not.toHaveBeenCalled();
  });

  it('exibe erro se não conseguir sincronizar contato durante o salvamento', async () => {
    const currentContact = contact(false);
    renderPage(currentContact, 'confirmed');
    mocks.crm.updateContact.mockRejectedValue(new Error('Falha de rede'));

    fireEvent.click(screen.getByRole('button', { name: 'Salvo no Histórico' }));

    expect((await screen.findByRole('alert')).textContent).toContain('1 contato(s) não foram atualizados');
    expect(mocks.crm.updateContact).toHaveBeenCalledWith('contact-1', expect.objectContaining({
      confirmedThisWeek: true,
      confirmedWeekKey: week.weekKey,
      confirmedNotes: 'Confirmado para o culto da semana',
    }));
  });

  it('não regrava contatos que já correspondem ao relatório salvo', async () => {
    mocks.crm = {};
    renderPage(contact(true), 'confirmed');
    fireEvent.click(screen.getByRole('button', { name: 'Salvo no Histórico' }));

    await waitFor(() => expect(mocks.crm.saveWeeklyReport).toHaveBeenCalledTimes(1));
    expect(mocks.crm.updateContact).not.toHaveBeenCalled();
  });

  it('inclui confirmações feitas depois do relatório como pendentes de salvar', async () => {
    const emptyReport = { ...report(), entries: [], summary: {
      total: 0, confirmed: 0, unconfirmed: 0, confirmationRate: 0,
      byCategory: { membros: 0, visitantes: 0, convidados: 0 }, topReasons: [],
    } };
    renderPage(contact(true), 'unconfirmed', emptyReport);

    expect(await screen.findAllByText('Ana Silva')).toHaveLength(2);
    expect(screen.getAllByText('Pendente de salvar')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Salvar Alterações' })).toBeTruthy();
  });
});