import { useEffect, useState } from 'react'
import {
  getAllOrders,
  getOrderById,
  getOrderSummary,
  getTodayDateValue,
  deleteOrder,
} from '../services/orderService'

const INITIAL_SUMMARY = {
  totalOrdersInDatabase: 0,
  ordersCreated: 0,
  pendingDeliveries: 0,
  ordersDelivered: 0,
}

const INITIAL_SUMMARY_RANGE = {
  period: 'daily',
  start: null,
  end: null,
}

export default function useAdminOrdersDashboard() {
  const todayDateValue = getTodayDateValue()

  const [previewId, setPreviewId] = useState('')
  const [orders, setOrders] = useState([])
  const [summaryPeriod, setSummaryPeriod] = useState('daily')
  const [summaryDate, setSummaryDate] = useState(todayDateValue)
  const [summary, setSummary] = useState(INITIAL_SUMMARY)
  const [summaryRange, setSummaryRange] = useState(INITIAL_SUMMARY_RANGE)
  const [activeOrderId, setActiveOrderId] = useState('')
  const [isSummaryLoading, setIsSummaryLoading] = useState(false)
  const [storageMessage, setStorageMessage] = useState('')
  const [isStorageLoading, setIsStorageLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  useEffect(() => {
    initializeDashboard()
  }, [])

  async function initializeDashboard() {
    setIsInitialLoading(true)

    const [ordersResult, summaryResult] = await Promise.all([
      getAllOrders(),
      getOrderSummary('daily', todayDateValue),
    ])

    if (ordersResult.success) {
      setOrders(ordersResult.data)
    } else {
      setStorageMessage(ordersResult.error)
    }

    if (summaryResult.success) {
      setSummary(summaryResult.summary)
      setSummaryRange(summaryResult.range)
    } else {
      setStorageMessage(summaryResult.error)
    }

    setIsInitialLoading(false)
  }

  async function loadOrders() {
    setStorageMessage('')
    setIsStorageLoading(true)

    const result = await getAllOrders()

    if (result.success) {
      setOrders(result.data)
    } else {
      setStorageMessage(result.error)
    }

    setIsStorageLoading(false)
    return result
  }

  async function loadSummary(period = summaryPeriod, date = summaryDate) {
    setIsSummaryLoading(true)

    const result = await getOrderSummary(period, date)

    if (result.success) {
      setSummary(result.summary)
      setSummaryRange(result.range)
    } else {
      setStorageMessage(result.error)
    }

    setIsSummaryLoading(false)
    return result
  }

  async function refreshDashboardData() {
    const [ordersResult, summaryResult] = await Promise.all([
      getAllOrders(),
      getOrderSummary(summaryPeriod, summaryDate),
    ])

    if (ordersResult.success) {
      setOrders(ordersResult.data)
    }

    if (summaryResult.success) {
      setSummary(summaryResult.summary)
      setSummaryRange(summaryResult.range)
    }

    if (!ordersResult.success || !summaryResult.success) {
      setStorageMessage(ordersResult.error || summaryResult.error || 'Failed to refresh dashboard data.')
      return false
    }

    return true
  }

  async function handleSummaryPeriodChange(period) {
    setSummaryPeriod(period)
    await loadSummary(period, summaryDate)
  }

  async function handleSummaryDateChange(event) {
    const date = event.target.value
    setSummaryDate(date)
    await loadSummary(summaryPeriod, date)
  }

  async function handlePreviewSubmit(event) {
    event.preventDefault()
    setStorageMessage('')

    const normalizedId = previewId.trim().toUpperCase()
    if (!normalizedId) {
      return
    }

    const result = await getOrderById(previewId)

    if (!result.success) {
      setActiveOrderId('')
      setStorageMessage(result.error)
      return
    }

    const order = result.data

    setOrders((current) => {
      const existingOrder = current.find((item) => item.trackingId === order.trackingId)

      if (!existingOrder) {
        return [...current, order]
      }

      return current.map((item) => (item.trackingId === order.trackingId ? order : item))
    })

    setActiveOrderId(order.trackingId)
    setStorageMessage(`Order ${order.trackingId} found. Scrolling to its row.`)
  }

  async function handleDeleteOrder(trackingId) {
    setStorageMessage('')

    const result = await deleteOrder(trackingId)

    if (!result.success) {
      setStorageMessage(result.error)
      return
    }

    setOrders((current) => current.filter((order) => order.trackingId !== trackingId))
    setActiveOrderId((current) => (current === trackingId ? '' : current))
    setStorageMessage(result.message)
    await loadSummary(summaryPeriod, summaryDate)
  }

  return {
    previewId,
    setPreviewId,
    orders,
    summaryPeriod,
    summaryDate,
    summary,
    summaryRange,
    activeOrderId,
    isSummaryLoading,
    storageMessage,
    isStorageLoading,
    isInitialLoading,
    setStorageMessage,
    loadOrders,
    loadSummary,
    refreshDashboardData,
    handleSummaryPeriodChange,
    handleSummaryDateChange,
    handlePreviewSubmit,
    handleDeleteOrder,
  }
}
