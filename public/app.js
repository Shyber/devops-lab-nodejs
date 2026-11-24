/* eslint-env browser */
const root = document.querySelector('#root')
const notice = document.querySelector('#notice')
const state = { token: null, user: null, page: 'reports', incidentId: null, categories: [] }
const statuses = ['REPORTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const it = () => ['ANALYST', 'ADMIN'].includes(state.user?.role)
const final = incident => ['CLOSED', 'REJECTED'].includes(incident.status)
const friendly = value => String(value || '').replaceAll('_', ' ').toLowerCase().replace(/^./, c => c.toUpperCase())
const date = value => new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })

function el (tag, attrs = {}, ...children) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null) continue
    if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value)
    else if (key === 'className') node.className = value
    else if (key in node && !key.startsWith('aria')) node[key] = value
    else node.setAttribute(key, value)
  }
  for (const child of children.flat()) {
    if (child !== null && child !== undefined) node.append(child instanceof Node ? child : document.createTextNode(String(child)))
  }
  return node
}
function message (text, error = false) {
  notice.textContent = text
  notice.className = `notice${error ? ' error' : ''}`
  notice.hidden = false
  clearTimeout(message.timer)
  message.timer = setTimeout(() => { notice.hidden = true }, 6500)
}
async function api (path, options = {}) {
  const headers = { ...options.headers }
  if (state.token) headers.Authorization = `Bearer ${state.token}`
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  const response = await fetch(path, { ...options, headers, body: options.body === undefined ? undefined : JSON.stringify(options.body) })
  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401 && state.token) {
      state.token = null
      state.user = null
      renderLogin()
      message('Your session has ended. Please sign in again.', true)
    }
    throw new Error(data?.message || `The request could not be completed (${response.status}).`)
  }
  return data
}
function button (label, callback, className = '') {
  return el('button', { type: 'button', className, onclick: callback }, label)
}
let fieldSequence = 0
function field (label, input, hint) {
  input.setAttribute('aria-label', label)
  const hintId = `field-hint-${++fieldSequence}`
  if (hint) input.setAttribute('aria-describedby', hintId)
  return el('label', {}, label, input, hint ? el('span', { className: 'field-hint', id: hintId }, hint) : null)
}
function input (name, props = {}) { return el('input', { name, ...props }) }
function select (name, values, selected = '', placeholder) {
  const node = el('select', { name })
  if (placeholder !== undefined) node.append(el('option', { value: '' }, placeholder))
  for (const value of values) {
    const [id, label] = Array.isArray(value) ? value : [value, friendly(value)]
    node.append(el('option', { value: String(id), selected: String(id) === String(selected) }, label))
  }
  return node
}
function badge (value) { return el('span', { className: `badge ${String(value).toLowerCase()}` }, friendly(value)) }
function formError () { return el('p', { className: 'form-error', role: 'alert', hidden: true }) }
function bindForm (form, error, action) {
  form.addEventListener('submit', async event => {
    event.preventDefault()
    if (!form.reportValidity()) return
    error.hidden = true
    const submits = [...form.querySelectorAll('[type=submit]')]
    submits.forEach(node => { node.disabled = true })
    try { await action(new FormData(form)) } catch (err) {
      error.textContent = err.message
      error.hidden = false
    } finally { submits.forEach(node => { node.disabled = false }) }
  })
}
function heading (title, subtitle, action) {
  return el('div', { className: 'heading' }, el('div', {}, el('h1', {}, title), el('p', {}, subtitle)), action)
}
function card (title, ...content) { return el('section', { className: 'card' }, title ? el('h2', {}, title) : null, ...content) }
function logo () { return el('div', { className: 'logo' }, el('span', { className: 'logo-mark', 'aria-hidden': 'true' }, 'C'), 'CIRS') }

function renderLogin () {
  root.replaceChildren()
  const email = input('email', { type: 'email', required: true, autocomplete: 'username', placeholder: 'you@example.test' })
  const password = input('password', { type: 'password', required: true, autocomplete: 'current-password' })
  const error = formError()
  const form = el('form', { className: 'fields' }, field('Email address', email), field('Password', password), error, el('button', { type: 'submit' }, 'Sign in →'))
  bindForm(form, error, async data => {
    const result = await api('/api/auth/login', { method: 'POST', body: { email: data.get('email'), password: data.get('password') } })
    state.token = result.token
    state.user = result.user
    state.page = it() ? 'dashboard' : 'reports'
    await render()
  })
  root.append(el('main', { className: 'login' },
    el('section', { className: 'login-brand' }, logo(), el('h1', {}, 'A clear path from report to response.'), el('p', {}, 'Report a campus security concern. Help the IT team understand, prioritise and resolve it.'), el('div', { className: 'brand-line' }, 'REPORT  /  TRIAGE  /  FOLLOW UP')),
    el('section', { className: 'login-panel' }, el('div', { className: 'login-form' }, el('div', { className: 'section-label' }, 'Campus incident reporting'), el('h2', {}, 'Welcome back'), el('p', { className: 'muted' }, 'Sign in to your account to continue.'), form,
      el('div', { className: 'demo-box' }, el('small', {}, 'Fictional demonstration accounts. Select a role to fill its email; use the password from the setup guide.'), el('div', { className: 'demo-list' }, ...[['Campus user', 'campus.user@example.test'], ['Analyst', 'maya.chen@example.test'], ['Administrator', 'admin@example.test']].map(([label, address]) => button(label, () => { email.value = address; password.focus() }, 'secondary')))),
      el('p', { className: 'muted', style: 'font-size:12px;margin-top:24px' }, 'For this local demonstration, use fictional information only. Never include passwords or recovery codes in a report.')))))
}
async function go (page, incidentId = null) {
  state.page = page
  state.incidentId = incidentId
  await render()
}
async function render () {
  if (!state.user) return renderLogin()
  const tabs = it() ? [['dashboard', 'Incident dashboard'], ['directory', 'Analyst directory']] : [['reports', 'My reports'], ['create', 'Report an incident']]
  if (state.user.role === 'ADMIN') tabs.push(['users', 'Accounts'], ['categories', 'Categories'])
  const content = el('main', { className: 'content', id: 'content', tabIndex: -1 }, el('p', { className: 'loading' }, 'Loading…'))
  const signout = button('Sign out', async () => {
    try { await api('/api/auth/logout', { method: 'POST' }) } catch (err) { message(err.message, true); return }
    state.token = null
    state.user = null
    renderLogin()
    message('You have signed out.')
  }, 'subtle')
  root.replaceChildren(el('div', { className: 'app-shell' }, el('aside', { className: 'sidebar' }, logo(), el('nav', { className: 'nav', 'aria-label': 'Main navigation' }, ...tabs.map(([key, title]) => button(title, () => go(key), state.page === key ? 'active' : ''))), el('div', { className: 'sidebar-bottom' }, 'CAMPUS SECURITY\n', el('br'), 'Fictional local demonstration', el('br'), 'Your reports. A coordinated response.')),
    el('div', { className: 'workspace' }, el('header', { className: 'topbar' }, el('small', {}, 'Cyber Incident Reporting System'), el('div', { className: 'profile' }, el('div', { className: 'profile-avatar', 'aria-hidden': 'true' }, state.user.name.slice(0, 1).toUpperCase()), el('div', {}, el('div', { className: 'profile-name' }, state.user.name), el('div', { className: 'profile-role' }, state.user.role)), signout)), content)))
  try {
    state.categories = await api('/api/categories')
    const pages = { reports: renderReports, dashboard: renderReports, create: renderCreate, detail: renderDetail, directory: renderDirectory, users: renderUsers, categories: renderCategories }
    await (pages[state.page] || renderReports)(content)
  } catch (err) {
    if (state.user) content.replaceChildren(heading('Unable to load this view', err.message), button('Try again', render))
  }
}
async function renderReports (content) {
  const staff = it()
  const listRoot = el('div')
  const refresh = async filters => {
    listRoot.replaceChildren(el('p', { className: 'loading' }, 'Loading reports…'))
    try {
      const query = new URLSearchParams(filters || {})
      const data = await api(staff ? `/api/incidents${query.size ? '?' + query : ''}` : '/api/incidents/my')
      listRoot.replaceChildren(reportTable(data))
    } catch (err) { listRoot.replaceChildren(el('p', { className: 'form-error', role: 'alert' }, err.message)) }
  }
  content.replaceChildren(heading(staff ? 'Incident dashboard' : 'My reports', staff ? 'Review incoming reports and coordinate the next action.' : 'Follow the progress of the incidents you have reported.', staff ? button('Refresh', () => render(), 'secondary') : button('+ Report an incident', () => go('create'))))
  if (staff) {
    const metrics = await api('/api/metrics')
    content.append(el('div', { className: 'stats' }, ...[[metrics.activeIncidents, 'Active incidents', 'Reports awaiting closure'], [metrics.criticalAlerts, 'Critical alerts', 'Open reports with critical priority'], [metrics.onlineAnalysts, 'Demo online analysts', 'Fictional demonstration presence']].map(([number, title, note]) => el('div', { className: 'card stat' }, el('small', {}, title), el('div', { className: 'number' }, number), el('p', {}, note)))))
    const filter = el('form', { className: 'filters' }, field('Status', select('status', statuses, '', 'All statuses')), field('Priority', select('priority', priorities, '', 'All priorities')), field('Category', select('categoryId', state.categories.map(c => [c.id, c.name]), '', 'All categories')), el('button', { type: 'submit' }, 'Apply filters'), button('Clear', () => { filter.reset(); refresh() }, 'secondary'))
    filter.addEventListener('submit', event => { event.preventDefault(); refresh(Object.fromEntries([...new FormData(filter)].filter(([, v]) => v))) })
    content.append(filter)
  }
  content.append(card(null, listRoot))
  await refresh()
}
function reportTable (records) {
  if (!records.length) return el('div', { className: 'empty' }, el('h3', {}, state.page === 'reports' ? 'No reports yet' : 'No matching reports'), el('p', {}, state.page === 'reports' ? 'Your submitted incidents will appear here.' : 'Try a different combination of filters.'))
  return el('div', { className: 'table-wrap' }, el('table', {}, el('thead', {}, el('tr', {}, ...['Incident', 'Status', 'Priority', 'Category', 'Reported'].map(t => el('th', { scope: 'col' }, t)))), el('tbody', {}, ...records.map(incident => el('tr', {},
    el('td', {}, el('div', { className: 'ref' }, `CIRS-${incident.id}`), button(incident.title, () => go('detail', incident.id), 'table-title')),
    el('td', {}, badge(incident.status)), el('td', {}, badge(incident.priority)), el('td', {}, state.categories.find(c => c.id === incident.categoryId)?.name || `Category ${incident.categoryId}`), el('td', {}, date(incident.createdAt)))))))
}
function incidentForm (incident = null) {
  const categories = [...state.categories]
  if (incident && !categories.some(c => c.id === incident.categoryId)) categories.push({ id: incident.categoryId, name: `Category ${incident.categoryId} (inactive)` })
  const error = formError()
  const form = el('form', { className: 'fields' },
    field('Title', input('title', { value: incident?.title || '', required: true, minLength: 5, maxLength: 120, placeholder: 'Briefly describe what happened' }), '5–120 characters after trimming.'),
    field('Category', select('categoryId', categories.map(c => [c.id, c.name]), incident?.categoryId || '', 'Choose a category')),
    field('Description', el('textarea', { name: 'description', value: incident?.description || '', required: true, minLength: 20, maxLength: 5000, rows: 6, placeholder: 'What happened? When did you notice it? Include relevant context.' }), '20–5,000 characters. Do not include passwords or recovery codes.'), error,
    el('div', { className: 'row' }, el('button', { type: 'submit' }, incident ? 'Save changes' : 'Submit report'), button('Cancel', () => go(incident ? 'detail' : 'reports', incident?.id), 'secondary')))
  form.elements.categoryId.required = true
  bindForm(form, error, async data => {
    const values = { title: data.get('title').trim(), description: data.get('description').trim(), categoryId: Number(data.get('categoryId')) }
    if (values.title.length < 5 || values.description.length < 20) throw new Error('After trimming, the title must contain at least 5 characters and the description at least 20.')
    const result = await api(incident ? `/api/incidents/${incident.id}` : '/api/incidents', { method: incident ? 'PUT' : 'POST', body: values })
    message(incident ? 'The report was updated.' : `Report submitted. Your reference is CIRS-${result.id}.`)
    await go('detail', result.id)
  })
  return form
}
async function renderCreate (content) {
  if (state.user.role !== 'USER') throw new Error('Only campus users can create incident reports.')
  content.replaceChildren(heading('Report an incident', 'Provide enough context to help the IT team understand your concern.'), el('div', { className: 'two-col' }, card(null, incidentForm()), card('What to include', el('p', {}, 'Describe the suspicious activity, the approximate time and any affected service.'), el('p', {}, 'Use fictional information for this demonstration. Avoid passwords, recovery codes or sensitive personal information.'), el('div', { className: 'info' }, 'The server sets your report reference, reporter, date, initial status and priority.'))))
}
async function renderDetail (content) {
  const incident = await api(`/api/incidents/${state.incidentId}`)
  const [comments, history] = await Promise.all([api(`/api/incidents/${incident.id}/comments`), api(`/api/incidents/${incident.id}/history`)])
  const cat = state.categories.find(c => c.id === incident.categoryId)
  const left = el('div', { className: 'stack' })
  const right = el('div', { className: 'stack' })
  content.replaceChildren(heading(`CIRS-${incident.id}`, incident.title, button('← Back to reports', () => go(it() ? 'dashboard' : 'reports'), 'secondary')), el('div', { className: 'two-col' }, left, right))
  const description = card(incident.title, el('div', { className: 'row', style: 'margin-bottom:20px' }, badge(incident.status), badge(incident.priority)), el('p', { className: 'detail-description' }, incident.description))
  const editable = !final(incident) && (it() || state.user.id === incident.reporterId)
  if (editable) description.append(el('div', { className: 'divider' }), button('Edit reported content', () => { description.replaceChildren(el('h2', {}, 'Edit report'), incidentForm(incident)) }, 'secondary'))
  if (!final(incident) && incident.status === 'REPORTED' && incident.assignedAnalystId === null && state.user.role === 'USER' && state.user.id === incident.reporterId) {
    description.append(button('Withdraw report', async () => {
      if (!window.confirm(`Permanently withdraw report CIRS-${incident.id} and its history? This cannot be undone.`)) return
      try { await api(`/api/incidents/${incident.id}`, { method: 'DELETE' }); message('The report was withdrawn.'); await go('reports') } catch (err) { message(err.message, true) }
    }, 'danger'))
  }
  left.append(description)
  const publicComments = comments.filter(c => !c.isInternal)
  left.append(commentsCard(incident, publicComments, false))
  if (it()) left.append(commentsCard(incident, comments.filter(c => c.isInternal), true))
  right.append(card('Report overview', el('dl', { className: 'meta' }, ...[['Reported', date(incident.createdAt)], ['Updated', date(incident.updatedAt)], ['Category', cat?.name || `Category ${incident.categoryId}`], ['Assigned analyst', incident.assignedAnalystId ? `Analyst #${incident.assignedAnalystId}` : 'Not assigned']].flatMap(([key, value]) => el('div', {}, el('dt', {}, key), el('dd', {}, value))))))
  if (it() && !final(incident)) right.append(await managementCard(incident))
  if (final(incident)) right.append(el('div', { className: 'info' }, 'This report is final and read-only. Existing comments and history remain available.'))
  right.append(card('History', history.length ? el('ol', { className: 'timeline' }, ...history.map(item => el('li', {}, el('strong', {}, friendly(item.action)), el('div', { className: 'comment-meta' }, `${date(item.at)} · Actor #${item.actorId}`), el('div', { className: 'change' }, `${formatValue(item.oldValue)} → ${formatValue(item.newValue)}`)))) : el('p', { className: 'muted' }, 'No recorded changes.')))
}
function formatValue (value) { return value === null ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value) }
function commentsCard (incident, comments, internal) {
  const section = card(internal ? 'Internal notes' : 'Public discussion', !comments.length ? el('p', { className: 'muted' }, internal ? 'No internal notes yet.' : 'No comments yet.') : el('div', {}, ...comments.map(comment => el('article', { className: `comment${internal ? ' internal' : ''}` }, el('div', { className: 'comment-meta' }, `${internal ? 'IT only · ' : ''}Author #${comment.authorId} · ${date(comment.createdAt)}`), el('p', {}, comment.text)))))
  if (!final(incident)) {
    const error = formError()
    const form = el('form', { className: 'fields', style: 'margin-top:20px' }, field(internal ? 'Add an internal note' : 'Add a public comment', el('textarea', { name: 'text', required: true, minLength: 1, maxLength: 2000, rows: 3 }), internal ? 'Only the IT team can read this note.' : 'The report owner and IT team can read this comment.'), error, el('button', { type: 'submit' }, internal ? 'Add note' : 'Post comment'))
    bindForm(form, error, async data => {
      const text = data.get('text').trim()
      if (!text) throw new Error('Enter at least one non-space character.')
      await api(`/api/incidents/${incident.id}/comments`, { method: 'POST', body: { text, isInternal: internal } })
      message(internal ? 'Internal note saved.' : 'Comment posted.')
      await render()
    })
    section.append(form)
  }
  return section
}
async function managementCard (incident) {
  const analysts = await api('/api/analysts')
  const panel = card('Manage incident')
  const assignError = formError()
  const assign = el('form', { className: 'fields' }, field('Assigned analyst', select('analystId', analysts.map(a => [a.id, a.name]), incident.assignedAnalystId || '', 'Choose an active analyst')), assignError, el('button', { type: 'submit', className: 'secondary' }, 'Save assignment'))
  assign.elements.analystId.required = true
  bindForm(assign, assignError, async data => {
    await api('/api/assignments', { method: 'POST', body: { incidentId: incident.id, analystId: Number(data.get('analystId')) } })
    message('Assignment saved.'); await render()
  })
  const priorityError = formError()
  const priority = el('form', { className: 'fields' }, field('Priority', select('priority', priorities, incident.priority)), priorityError, el('button', { type: 'submit', className: 'secondary' }, 'Save priority'))
  bindForm(priority, priorityError, async data => {
    await api(`/api/incidents/${incident.id}/priority`, { method: 'PATCH', body: { priority: data.get('priority') } })
    message('Priority saved.'); await render()
  })
  const allowed = { REPORTED: ['REJECTED'], ASSIGNED: ['IN_PROGRESS', 'REJECTED'], IN_PROGRESS: ['RESOLVED', 'REJECTED'], RESOLVED: ['CLOSED'] }[incident.status] || []
  const statusError = formError()
  const statusInput = select('status', allowed)
  const reason = el('textarea', { name: 'reason', maxLength: 2000, rows: 3 })
  const reasonLabel = field('Public explanation', reason, 'Required when resolving or rejecting. Visible to the report owner.')
  const updateReason = () => { reason.required = ['RESOLVED', 'REJECTED'].includes(statusInput.value); reasonLabel.hidden = !reason.required }
  statusInput.addEventListener('change', updateReason); updateReason()
  const status = el('form', { className: 'fields' }, field('Next status', statusInput), reasonLabel, statusError, el('button', { type: 'submit' }, 'Change status'))
  bindForm(status, statusError, async data => {
    const body = { status: data.get('status') }
    if (['RESOLVED', 'REJECTED'].includes(body.status)) body.reason = data.get('reason').trim()
    await api(`/api/incidents/${incident.id}/status`, { method: 'PATCH', body })
    message('Status updated.'); await render()
  })
  panel.append(assign, el('div', { className: 'divider' }), priority, el('div', { className: 'divider' }), status)
  return panel
}
async function renderDirectory (content) {
  if (!it()) throw new Error('The analyst directory is available to the IT team.')
  const analysts = await api('/api/analysts?active=all')
  content.replaceChildren(heading('Analyst directory', 'The people available to review and handle incident reports.'), el('div', { className: 'three-col' }, ...analysts.map(a => card(a.name, el('p', { className: 'muted' }, a.email), el('div', { className: 'row' }, badge(a.role), el('span', { className: 'pill' }, a.active ? 'Active' : 'Inactive'))))))
}
async function renderUsers (content) {
  if (state.user.role !== 'ADMIN') throw new Error('Account management requires an administrator.')
  const users = await api('/api/users')
  const error = formError()
  const create = el('form', { className: 'fields compact-form' }, el('h3', {}, 'Create an account'), el('div', { className: 'three-col' }, field('Name', input('name', { required: true, minLength: 2, maxLength: 100 })), field('Email', input('email', { type: 'email', required: true })), field('Role', select('role', ['USER', 'ANALYST', 'ADMIN'], 'USER'))), field('Initial password', input('password', { type: 'password', required: true, minLength: 10, autocomplete: 'new-password' }), 'Give the account owner this initial password separately.'), error, el('button', { type: 'submit' }, 'Create account'))
  bindForm(create, error, async data => { await api('/api/users', { method: 'POST', body: Object.fromEntries(data) }); message('Account created.'); await render() })
  const rows = users.map(user => {
    const err = formError()
    const form = el('form', { className: 'admin-item' }, field('Name', input('name', { value: user.name, required: true, minLength: 2, maxLength: 100 })), field('Email', input('email', { value: user.email, type: 'email', required: true })), field('Role', select('role', ['USER', 'ANALYST', 'ADMIN'], user.role)), field('Access', select('active', [['true', 'Active'], ['false', 'Inactive']], String(user.active))), el('button', { type: 'submit', className: 'secondary' }, 'Save'), err)
    bindForm(form, err, async data => {
      await api(`/api/users/${user.id}`, { method: 'PUT', body: { name: data.get('name'), email: data.get('email'), role: data.get('role'), active: data.get('active') === 'true' } })
      message('Account updated.')
      if (user.id === state.user.id) state.user = await api('/api/auth/me')
      await render()
    })
    return form
  })
  content.replaceChildren(heading('Accounts', 'Create accounts, update roles and control access without deleting past reports.'), el('div', { className: 'stack' }, card(null, create), card('Existing accounts', el('div', { className: 'info', style: 'margin-bottom:22px' }, 'Reassign open incidents before deactivating an analyst. The last active administrator is protected.'), el('div', { className: 'admin-list' }, ...rows))))
}
async function renderCategories (content) {
  if (state.user.role !== 'ADMIN') throw new Error('Category management requires an administrator.')
  const categories = await api('/api/categories?active=all')
  const error = formError()
  const create = el('form', { className: 'row' }, el('div', { className: 'grow' }, field('New category name', input('name', { required: true, maxLength: 100 }))), el('button', { type: 'submit', style: 'align-self:flex-end' }, 'Add category'), error)
  bindForm(create, error, async data => { await api('/api/categories', { method: 'POST', body: { name: data.get('name').trim() } }); message('Category added.'); await render() })
  const rows = categories.map(category => {
    const err = formError()
    const form = el('form', { className: 'admin-item category' }, field('Category name', input('name', { value: category.name, required: true, maxLength: 100 })), field('Availability', select('active', [['true', 'Active'], ['false', 'Inactive']], String(category.active))), el('button', { type: 'submit', className: 'secondary' }, 'Save'), err)
    bindForm(form, err, async data => { await api(`/api/categories/${category.id}`, { method: 'PUT', body: { name: data.get('name').trim(), active: data.get('active') === 'true' } }); message('Category saved.'); await render() })
    return form
  })
  content.replaceChildren(heading('Categories', 'Keep reporting options relevant. Deactivation preserves existing incident links.'), el('div', { className: 'stack' }, card(null, create), card('Existing categories', el('div', { className: 'admin-list' }, ...rows))))
}

renderLogin()
