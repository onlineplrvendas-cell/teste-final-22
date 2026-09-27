import { describe, expect, it } from 'vitest';
import { verifyUserProfile, loginEmail } from '../src/utils/userProfile';
import { getAllowedTabsForUser } from '../src/utils/permissions';

const profile = { name: 'Líder', role: 'lider_conexao', active: true, assignedCongregations: 'Recreio, Curicica,Guaratiba' };
describe('perfil autorizado', () => {
  it('preserva o líder do Conexão e converte a lista antiga de congregações', () => {
    const user = verifyUserProfile({ ...profile, password: 'não guardar' }, 'auth-uid', 'lider@example.com');
    expect(user.assignedCongregations).toEqual(['Recreio', 'Curicica', 'Guaratiba']);
    expect(user.uid).toBe('auth-uid');
    expect(user.password).toBeUndefined();
    expect(getAllowedTabsForUser(user)).toEqual(['conexaojovem', 'security']);
  });
  it.each([undefined, null, '', 'desconhecido'])('nunca assume administrador para função %s', role => {
    expect(() => verifyUserProfile({ ...profile, role }, 'uid', null)).toThrow('função válida');
  });
  it.each([false, 'true', undefined])('não libera um perfil inativo ou malformado', active => {
    expect(() => verifyUserProfile({ ...profile, active }, 'uid', null)).toThrow('desativado');
  });
  it('não atribui equipe ou congregação por padrão', () => {
    expect(() => verifyUserProfile({ ...profile, role: 'lider_equipe' }, 'uid', null)).toThrow('sem equipe');
    expect(() => verifyUserProfile({ ...profile, assignedCongregations: [] }, 'uid', null)).toThrow('sem congregação');
  });
  it('aceita login sintético e e-mail cadastrado sem modificar a senha', () => {
    expect(loginEmail(' Lider.Azul ')).toBe('lider.azul@casadedeus.org');
    expect(loginEmail(' Pessoa@Example.com ')).toBe('pessoa@example.com');
  });
});
