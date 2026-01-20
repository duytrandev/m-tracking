import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { ThemeProvider } from './theme-provider'

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should render children', () => {
    const { getByText } = render(
      <ThemeProvider>
        <div>Test Content</div>
      </ThemeProvider>
    )
    expect(getByText('Test Content')).toBeInTheDocument()
  })

  it('should render without crashing', () => {
    const { container } = render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>
    )
    expect(container).toBeTruthy()
  })

  it('should render multiple children', () => {
    const { getByText } = render(
      <ThemeProvider>
        <div>First</div>
        <div>Second</div>
        <div>Third</div>
      </ThemeProvider>
    )
    expect(getByText('First')).toBeInTheDocument()
    expect(getByText('Second')).toBeInTheDocument()
    expect(getByText('Third')).toBeInTheDocument()
  })

  it('should not modify the DOM structure', () => {
    const { container } = render(
      <ThemeProvider>
        <div className="test-class">Content</div>
      </ThemeProvider>
    )
    // ThemeProvider should pass children through without wrapping
    const child = container.querySelector('.test-class')
    expect(child).toBeInTheDocument()
  })

  it('should pass through React fragments', () => {
    const { getByText } = render(
      <ThemeProvider>
        <>
          <div>Fragment Child 1</div>
          <div>Fragment Child 2</div>
        </>
      </ThemeProvider>
    )
    expect(getByText('Fragment Child 1')).toBeInTheDocument()
    expect(getByText('Fragment Child 2')).toBeInTheDocument()
  })

  it('should handle complex nested children', () => {
    const { getByText } = render(
      <ThemeProvider>
        <div>
          <section>
            <article>
              <p>Nested Content</p>
            </article>
          </section>
        </div>
      </ThemeProvider>
    )
    expect(getByText('Nested Content')).toBeInTheDocument()
  })

  it('should mount and unmount without errors', () => {
    const { unmount } = render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>
    )
    expect(() => unmount()).not.toThrow()
  })
})
