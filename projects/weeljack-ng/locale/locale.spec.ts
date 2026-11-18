import type { WjOwnStrings } from 'weeljack-ng';
import { _WJ_EN } from 'weeljack-ng/private';
import { en, vi } from './public-api';

/** Every `WjOwnStrings` key; the `satisfies` fails to compile when one is added to the type only. */
const OWN_KEYS = [
  'showPassword',
  'hidePassword',
  'breadcrumb',
  'home',
  'moreActions',
] as const satisfies readonly (keyof WjOwnStrings)[];

function keys(value: object | undefined): string[] {
  return Object.keys(value ?? {}).sort();
}

describe('weeljack-ng/locale', () => {
  it('exports en as the very object the root merges over', () => {
    expect(en).toBe(_WJ_EN);
  });

  it('gives en and vi the same top-level and aria key sets', () => {
    expect(keys(vi)).toEqual(keys(en));
    expect(keys(vi.aria)).toEqual(keys(en.aria));
    expect(keys(en)).toHaveLength(73);
    expect(keys(en.aria)).toHaveLength(60);
  });

  it('carries every own key in both languages', () => {
    for (const locale of [en, vi]) {
      for (const key of OWN_KEYS) {
        expect(locale.wj?.[key]).toBeTruthy();
      }
    }
    // `toMatchObject`: every family adds its own `wj` keys, so the group is not an exact list.
    expect(vi.wj).toMatchObject({
      showPassword: 'Hiện mật khẩu',
      hidePassword: 'Ẩn mật khẩu',
      breadcrumb: 'Đường dẫn',
      home: 'Trang chủ',
      moreActions: 'Thêm thao tác',
    });
  });

  it('reads Vietnamese for the keys the library components use', () => {
    expect(vi.weak).toBe('Yếu');
    expect(vi.medium).toBe('Trung bình');
    expect(vi.strong).toBe('Mạnh');
    expect(vi.passwordPrompt).toBe('Nhập mật khẩu');
    expect(vi.aria?.close).toBe('Đóng');
    expect(vi['dateFormat']).toBe('dd/mm/yy');
    expect(vi['firstDayOfWeek']).toBe(1);
  });
});
