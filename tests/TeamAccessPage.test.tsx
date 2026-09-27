import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ currentUser: { uid: 'admin', role: 'admin' }, isDemoMode: false }) }));
vi.mock('../src/context/CRMContext', () => ({ useCRM: () => ({
  users: [{ uid: 'leader', name: 'Líder', email: 'real@example.com', username: 'login.diferente', role: 'lider_conexao', assignedCongregations: ['Recreio'], active: true }],
  deleteUser: vi.fn(), updateUser: vi.fn(),
}) }));
import { TeamAccessPage } from '../src/pages/TeamAccessPage';
afterEach(cleanup);
it('mostra a credencial real sem inventar uma senha para o líder', () => {
  render(<TeamAccessPage onOpenNewMember={() => {}} onEditMember={() => {}} />);
  expect(screen.getAllByText('Definida no cadastro')).toHaveLength(2);
  expect(screen.queryByText('login.diferente')).toBeNull();
  expect(screen.getAllByText('real@example.com').length).toBeGreaterThan(1);
  expect(screen.queryAllByRole('button', { name: 'Ver senha' })).toHaveLength(0);
});
