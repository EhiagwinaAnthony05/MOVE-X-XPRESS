import { useEffect, useRef, useState } from 'react'
import { formatAdminDateTime } from '../utils/formatDate'
import './OrdersTable.css'

function OrdersTable({ orders, activeOrderId, isLoading, onEdit, onDelete }) {
  const rowRefs = useRef({})
  const [pendingDeleteId, setPendingDeleteId] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)

  function openDetailsModal(order) {
    setSelectedOrder(order)
  }

  function closeDetailsModal() {
    setSelectedOrder(null)
  }

  function openDeleteModal(trackingId) {
    setPendingDeleteId(trackingId)
  }

  function closeDeleteModal() {
    setPendingDeleteId('')
  }

  function confirmDelete() {
    if (!pendingDeleteId) {
      return
    }

    onDelete(pendingDeleteId)
    closeDeleteModal()
  }

  const riderName =
    selectedOrder?.rider?.name ||
    selectedOrder?.rider?.deliveredSnapshot?.name ||
    'Unassigned'
  const riderPhone =
    selectedOrder?.rider?.phone ||
    selectedOrder?.rider?.deliveredSnapshot?.phone ||
    '-'
  const riderLocation =
    selectedOrder?.rider?.currentLocation ||
    selectedOrder?.rider?.deliveredSnapshot?.currentLocation ||
    '-'

  const sortedOrders = [...orders].sort((leftOrder, rightOrder) => {
    const leftDelivered = (leftOrder.delivery?.status || '').toLowerCase() === 'delivered'
    const rightDelivered = (rightOrder.delivery?.status || '').toLowerCase() === 'delivered'

    if (leftDelivered !== rightDelivered) {
      return leftDelivered ? 1 : -1
    }

    const leftCreatedAt = leftOrder.createdAt ? new Date(leftOrder.createdAt).getTime() : 0
    const rightCreatedAt = rightOrder.createdAt ? new Date(rightOrder.createdAt).getTime() : 0

    return rightCreatedAt - leftCreatedAt
  })

  useEffect(() => {
    if (!activeOrderId) {
      return
    }

    const targetRow = rowRefs.current[activeOrderId]
    if (!targetRow) {
      return
    }

    targetRow.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
  }, [activeOrderId, sortedOrders])

  return (
    <>
      <div className='admin-table-wrap'>
        <table className='admin-table'>
          <thead>
            <tr>
              <th>S/N</th>
              <th>Tracking ID</th>
              <th>Date Created</th>
              <th>Sender</th>
              <th>Receiver</th>
              <th>Package</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedOrders.length === 0 ? (
              <tr>
                <td colSpan='9' className='admin-table-empty'>
                  {isLoading ? 'Loading orders...' : 'No orders found yet.'}
                </td>
              </tr>
            ) : (
              sortedOrders.map((order, index) => (
                <tr
                  key={order.trackingId}
                  ref={(element) => {
                    if (element) {
                      rowRefs.current[order.trackingId] = element
                    }
                  }}
                  className={activeOrderId === order.trackingId ? 'admin-order-row-highlight' : ''}
                >
                  <td>{index + 1}</td>
                  <td>
                    <button
                      type='button'
                      className='admin-tracking-link'
                      onClick={() => openDetailsModal(order)}
                    >
                      {order.trackingId}
                    </button>
                  </td>
                  <td>{formatAdminDateTime(order.createdAt)}</td>
                  <td>{order.sender?.name || '-'}</td>
                  <td>{order.receiver?.name || '-'}</td>
                  <td>{order.package?.description || '-'}</td>
                  <td>{order.delivery?.status || '-'}</td>
                  <td>{formatAdminDateTime(order.updatedAt)}</td>
                  <td>
                    <div className='admin-row-actions'>
                      <button type='button' className='admin-row-btn' onClick={() => onEdit(order)}>
                        Edit
                      </button>
                      <button type='button' className='admin-row-btn danger' onClick={() => openDeleteModal(order.trackingId)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pendingDeleteId && (
        <div className='admin-delete-modal-overlay' onClick={closeDeleteModal}>
          <section className='admin-delete-modal' onClick={(event) => event.stopPropagation()}>
            <h4>Delete Order?</h4>
            <p>
              This action will permanently remove <strong>{pendingDeleteId}</strong>.
            </p>
            <div className='admin-delete-modal-actions'>
              <button type='button' className='admin-delete-btn secondary' onClick={closeDeleteModal}>
                Cancel
              </button>
              <button type='button' className='admin-delete-btn primary' onClick={confirmDelete}>
                Yes, Delete
              </button>
            </div>
          </section>
        </div>
      )}

      {selectedOrder && (
        <div className='admin-delete-modal-overlay' onClick={closeDetailsModal}>
          <section className='admin-order-modal' onClick={(event) => event.stopPropagation()}>
            <div className='admin-order-modal__header'>
              <h4>Order Details: {selectedOrder.trackingId}</h4>
              <button type='button' className='admin-delete-btn secondary' onClick={closeDetailsModal}>
                Close
              </button>
            </div>

            <div className='admin-order-modal__grid'>
              <p><strong>Status:</strong> {selectedOrder.delivery?.status || '-'}</p>
              <p><strong>Created:</strong> {formatAdminDateTime(selectedOrder.createdAt)}</p>
              <p><strong>Updated:</strong> {formatAdminDateTime(selectedOrder.updatedAt)}</p>
              <p><strong>Package:</strong> {selectedOrder.package?.description || '-'}</p>
              <p><strong>Sender:</strong> {selectedOrder.sender?.name || '-'} ({selectedOrder.sender?.phone || '-'})</p>
              <p><strong>Sender Address:</strong> {selectedOrder.sender?.address || '-'}</p>
              <p><strong>Receiver:</strong> {selectedOrder.receiver?.name || '-'} ({selectedOrder.receiver?.phone || '-'})</p>
              <p><strong>Receiver Address:</strong> {selectedOrder.receiver?.address || '-'}</p>
              <p><strong>Rider:</strong> {riderName}</p>
              <p><strong>Rider Phone:</strong> {riderPhone}</p>
              <p><strong>Current Location:</strong> {riderLocation}</p>
              <p><strong>ETA:</strong> {selectedOrder.rider?.estimatedDelivery || '-'}</p>
            </div>

            <div className='admin-order-modal__timeline'>
              <h5>Progress Timeline</h5>
              <ul>
                {(selectedOrder.steps || []).map((step, index) => (
                  <li key={`${step.status}-${index}`}>
                    <strong>{step.status}</strong>
                    {' - '}
                    {step.completed ? `${step.date || ''} ${step.time || ''}`.trim() || 'Completed' : 'Pending'}
                    {step.location ? ` | ${step.location}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

export default OrdersTable