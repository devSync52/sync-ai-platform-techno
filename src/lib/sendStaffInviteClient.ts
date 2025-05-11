import { sendStaffInviteAction } from '@/actions/sendStaffInviteAction'

export const sendStaffInvite = async (email: string, role: 'admin' | 'staff-admin' | 'staff-user') => {
  return await sendStaffInviteAction({ email, role })
}