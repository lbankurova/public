--name: FunctionInfoByFriendlyName
--input: string name
--connection: System:DatagrokAdmin
select * from event_types et
where friendly_name = @name;
--end

--name: FunctionInfoBySource
--input: string name
--input: string date { pattern: datetime }
--input: list users
--connection: System:DatagrokAdmin
select et.* from event_types et
join events e on e.event_type_id = et.id
join users_sessions s on e.session_id = s.id
join users u on u.id = s.user_id
where @date(e.event_time)
and (u.login = any(@users) or @users = ARRAY['all'])
and et.error_source = @name
--end
