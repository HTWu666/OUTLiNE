local listKey = KEYS[1]
local lockKey = KEYS[2]

local element = redis.call('rpop', listKey)
local exists = redis.call('exists', listKey)
if exists == 0 then
    redis.call('set', lockKey, 'noData')
end

return element