import { Component, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Translation } from '@openng/optimus-ui/api';
import { Optimus } from '@openng/optimus-ui/config';
import { vi as viLocale } from 'weeljack-ng/locale';
import { _WJ_EN, _checkWeeljackSetup } from 'weeljack-ng/private';
import { provideWeeljack, type WjThemeOptions, type WjTranslation } from './public-api';

/** quanoi's Vietnamese translation (`apps/owner/src/app/app.config.ts`), copied as a fixture. */
const QUANOI_VI = {
  accept: 'Đồng ý',
  reject: 'Hủy',
  choose: 'Chọn',
  upload: 'Tải lên',
  cancel: 'Hủy',
  close: 'Đóng',
  yes: 'Có',
  no: 'Không',
  clear: 'Xóa',
  apply: 'Áp dụng',
  today: 'Hôm nay',
  weekHeader: 'Tuần',
  noResultsMessage: 'Không tìm thấy kết quả',
  emptyMessage: 'Không có dữ liệu',
  aria: {
    trueLabel: 'Đúng',
    falseLabel: 'Sai',
    nullLabel: 'Không chọn',
    star: '1 sao',
    stars: '{0} sao',
    selectAll: 'Chọn tất cả',
    unselectAll: 'Bỏ chọn tất cả',
    close: 'Đóng',
    previous: 'Trước',
    next: 'Tiếp',
    navigation: 'Điều hướng',
    scrollTop: 'Cuộn lên đầu',
    moveTop: 'Lên đầu',
    moveUp: 'Lên',
    moveDown: 'Xuống',
    moveBottom: 'Xuống cuối',
    moveToTarget: 'Chuyển sang đích',
    moveToSource: 'Chuyển về nguồn',
    moveAllToTarget: 'Chuyển tất cả sang đích',
    moveAllToSource: 'Chuyển tất cả về nguồn',
    pageLabel: 'Trang {page}',
    firstPageLabel: 'Trang đầu',
    lastPageLabel: 'Trang cuối',
    nextPageLabel: 'Trang tiếp',
    prevPageLabel: 'Trang trước',
    rowsPerPageLabel: 'Dòng mỗi trang',
    jumpToPageDropdownLabel: 'Chuyển đến trang',
    jumpToPageInputLabel: 'Nhập số trang',
    selectRow: 'Chọn hàng',
    unselectRow: 'Bỏ chọn hàng',
    expandRow: 'Mở rộng hàng',
    collapseRow: 'Thu gọn hàng',
    showFilterMenu: 'Hiện bộ lọc',
    hideFilterMenu: 'Ẩn bộ lọc',
    filterOperator: 'Toán tử lọc',
    filterConstraint: 'Điều kiện lọc',
    editRow: 'Sửa hàng',
    saveEdit: 'Lưu',
    cancelEdit: 'Hủy',
    listView: 'Dạng danh sách',
    gridView: 'Dạng lưới',
    slide: 'Trượt',
    slideNumber: '{slideNumber}',
    zoomImage: 'Phóng to ảnh',
    zoomIn: 'Phóng to',
    zoomOut: 'Thu nhỏ',
    rotateRight: 'Xoay phải',
    rotateLeft: 'Xoay trái',
  },
};

// Type level (FR-9): the library's translation feeds Optimus, and an Optimus-shaped object feeds
// the library's, directly and spread over a complete locale. A failure here is a compile error.
const toOptimus: Translation = _WJ_EN satisfies WjTranslation;
const fromQuanoi: WjTranslation = QUANOI_VI;
const spread: WjTranslation = { ...viLocale, ...QUANOI_VI };

/** Stands in for the first `wj-*` component: it runs the setup check the way a wrapper will. */
@Component({ selector: 'wj-translation-probe', template: 'probe' })
class Probe {
  constructor() {
    _checkWeeljackSetup('wj-translation-probe');
  }
}

async function setup(options?: WjThemeOptions): Promise<void> {
  TestBed.configureTestingModule({ providers: [provideWeeljack(options)] });
  const fixture = TestBed.createComponent(Probe);
  await fixture.whenStable();
}

/** What Optimus holds under `key` after bootstrap. */
function read(key: string): unknown {
  return TestBed.inject(Optimus).getTranslation(key);
}

describe('provideWeeljack translation', () => {
  afterEach(() => {
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
  });

  it('accepts the shapes the type-level checks above compile', () => {
    expect(toOptimus).toBe(_WJ_EN);
    expect(fromQuanoi.aria?.close).toBe('Đóng');
    expect(spread['reject']).toBe('Hủy');
  });

  describe('merge', () => {
    it('passes the English default, with the wj group, when no translation is given', async () => {
      await setup();

      // `toMatchObject`: every family adds its own `wj` keys, so the group is not an exact list.
      expect(read('wj')).toMatchObject({
        showPassword: 'Show Password',
        hidePassword: 'Hide Password',
      });
      expect(read('weak')).toBe('Weak');
      expect(read('aria')).toMatchObject({ close: 'Close', listLabel: 'Option List' });
    });

    it('keeps every other English key when the top level is partial', async () => {
      await setup({ translation: { weak: 'Yếu' } });

      expect(read('weak')).toBe('Yếu');
      expect(read('medium')).toBe('Medium');
      expect(read('passwordPrompt')).toBe('Enter a password');
      expect(read('dayNames')).toEqual(_WJ_EN.dayNames);
    });

    it('merges aria one level deep, never handing Optimus a partial aria', async () => {
      await setup({ translation: { aria: { close: 'Đóng' } } });

      expect(read('aria')).toMatchObject({
        close: 'Đóng',
        listLabel: 'Option List',
        maximizeLabel: 'Maximize',
      });
    });

    it('keeps the other own key when wj is partial', async () => {
      await setup({ translation: { wj: { showPassword: 'Hiện' } } });

      expect(read('wj')).toMatchObject({ showPassword: 'Hiện', hidePassword: 'Hide Password' });
    });

    it('passes an extra key through', async () => {
      await setup({ translation: { noResultsMessage: 'Nothing here', aria: { yes: 'Có' } } });

      expect(read('noResultsMessage')).toBe('Nothing here');
      expect(read('aria')).toMatchObject({ yes: 'Có', close: 'Close' });
    });

    it('replaces an array as a value', async () => {
      await setup({ translation: { dayNames: ['a', 'b'] } });

      expect(read('dayNames')).toEqual(['a', 'b']);
    });
  });

  describe('quanoi', () => {
    it('keeps its own strings over vi and the vi own group', async () => {
      await setup({
        translation: { ...viLocale, ...QUANOI_VI },
        primary: '#c2410c',
        darkMode: 'off',
      });

      expect(read('reject')).toBe('Hủy');
      expect(read('noResultsMessage')).toBe('Không tìm thấy kết quả');
      expect(read('aria')).toMatchObject({ close: 'Đóng' });
      expect(read('wj')).toMatchObject({ showPassword: 'Hiện mật khẩu' });
    });
  });

  describe('left alone', () => {
    it('keeps WJ0002 silent and the wj prefix when a translation is passed', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      await setup({ translation: viLocale });

      expect(warn).not.toHaveBeenCalled();
      expect(
        getComputedStyle(document.documentElement).getPropertyValue('--wj-primary-color').trim(),
      ).toBe('#09090b');
    });

    it('does not touch LOCALE_ID or <html lang>', async () => {
      const lang = document.documentElement.lang;
      TestBed.configureTestingModule({});
      const before = TestBed.inject(LOCALE_ID);
      TestBed.resetTestingModule();

      await setup({ translation: viLocale });

      expect(TestBed.inject(LOCALE_ID)).toBe(before);
      expect(document.documentElement.lang).toBe(lang);
    });
  });
});
