import { sendStaffInviteAction } from '@/actions/sendStaffInviteAction'

export const sendStaffInvite = async (
  email: string,
  role: 'admin' | 'staff-admin' | 'staff-user',
  accountId: string,
  invitedBy: string
) => {
  return await sendStaffInviteAction({ email, role, accountId, invitedBy })
}