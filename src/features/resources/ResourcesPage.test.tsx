import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { App } from '../../app/App';
import { defaultPreferences, usePreferenceStore } from '../../store/preferences';
import { defaultResourceState, useResourceNavigatorStore } from '../../store/resourceNavigator';

describe('resources navigator', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/resources');
    window.localStorage.clear();
    usePreferenceStore.setState(defaultPreferences);
    useResourceNavigatorStore.setState({
      ...defaultResourceState,
      favoriteIds: [],
      customResources: [],
      customCategories: [],
      categoryOrder: [...defaultResourceState.categoryOrder],
    });
  });

  it('searches by resource name and keyword', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: '校园导航' })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: '搜索资源' }), { target: { value: '图书馆' } });
    expect(screen.getByText('FAU 图书馆')).toBeInTheDocument();
    expect(screen.queryByText('StudOn')).not.toBeInTheDocument();
  });

  it('favorites and pins a resource', () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: '收藏' })[0]!);
    expect(screen.getByRole('heading', { level: 2, name: '我的收藏' })).toBeInTheDocument();
    expect(useResourceNavigatorStore.getState().favoriteIds).toHaveLength(1);
  });

  it('shows validation instead of saving an invalid personal URL', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /添加个人网站/ }));
    fireEvent.change(screen.getByRole('textbox', { name: '名称' }), { target: { value: 'Unsafe' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'HTTPS 链接' }), { target: { value: 'http://example.org' } });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));
    expect(screen.getByText('请输入有效的 HTTPS 链接。')).toBeInTheDocument();
    expect(useResourceNavigatorStore.getState().customResources).toHaveLength(0);
  });
});
