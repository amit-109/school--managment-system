import toast from 'react-hot-toast'

const warningStyle = {
  background: '#fffbeb',
  color: '#92400e',
  border: '1px solid #fde68a'
}

const infoStyle = {
  background: '#eff6ff',
  color: '#1e40af',
  border: '1px solid #bfdbfe'
}

const notify = {
  success: (message, options) => toast.success(message, options),
  error: (message, options) => toast.error(message, options),
  warning: (message, options = {}) => toast(message, {
    icon: '!',
    style: warningStyle,
    ...options
  }),
  info: (message, options = {}) => toast(message, {
    icon: 'i',
    style: infoStyle,
    ...options
  })
}

export default notify
