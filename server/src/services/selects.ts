export const rolePermissionInclude = {
  include: {
    permission: true
  }
} as const;

export const roleWithPermissionsInclude = {
  include: {
    permissions: rolePermissionInclude
  }
} as const;

export const userAuthInclude = {
  role: {
    include: {
      permissions: rolePermissionInclude
    }
  },
  employee: {
    include: {
      department: true
    }
  }
} as const;

export const userListSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  role: {
    select: {
      id: true,
      name: true
    }
  },
  employee: {
    select: {
      id: true,
      employeeCode: true,
      department: {
        select: {
          id: true,
          name: true
        }
      }
    }
  }
} as const;

export const departmentListSelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  managerEmployee: {
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true
    }
  },
  _count: {
    select: {
      employees: true
    }
  }
} as const;

export const employeeListSelect = {
  id: true,
  employeeCode: true,
  firstName: true,
  lastName: true,
  email: true,
  jobTitle: true,
  gender: true,
  employmentType: true,
  dateOfJoining: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  department: {
    select: {
      id: true,
      name: true
    }
  },
  user: {
    select: {
      id: true,
      email: true
    }
  }
} as const;
