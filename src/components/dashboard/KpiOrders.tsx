{
    id: 'new_orders',
    label: (
      <div className="flex items-center gap-3">
        <ShoppingBag />
        <div>
          <p className="text-xs text-gray-500">New Orders (24h)</p>
          <p className="text-xl font-bold text-[#3f2d90]">{newOrdersCount}</p>
        </div>
      </div>
    ),
    type: 'kpi',
  },
  {
    id: 'new_orders_amount',
    label: (
      <div className="flex items-center gap-3">
        <DollarSignIcon />
        <div>
          <p className="text-xs text-gray-500">New Orders Amount (24h)</p>
          <p className="text-xl font-bold text-primary">
            {newOrdersAmount.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
            })}
          </p>
        </div>
      </div>
    ),
    type: 'kpi',
  },