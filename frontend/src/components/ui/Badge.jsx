import { cx } from '../../lib/utils'

export function Badge({ className, children, point }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', className)}>
      {point && <span className={cx('size-1.5 rounded-full', point)} aria-hidden />}
      {children}
    </span>
  )
}
