/**
 * Script to update existing users with appropriate roles
 * 
 * This script should be run after the migration that adds the role field to the User model.
 * It assigns roles based on predefined criteria or a mapping file.
 * 
 * Usage:
 * npx ts-node scripts/update_user_roles.ts
 */

import { PrismaClient } from '@prisma/client';

// Define UserRole enum to match the Prisma schema
enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

// Define user type for type safety
interface UserWithId {
  id: string;
  email?: string;
}

const prisma = new PrismaClient();

// Define admin email addresses
const SUPER_ADMIN_EMAILS = [
  'superadmin@launchify.com',
  // Add other super admin emails here
];

const ADMIN_EMAILS = [
  'admin@launchify.com',
  // Add other admin emails here
];

const MODERATOR_EMAILS = [
  'moderator@launchify.com',
  // Add other moderator emails here
];

async function updateUserRoles() {
  console.log('Starting user role update...');
  
  try {
    // Update super admins
    const superAdminResult = await prisma.user.updateMany({
      where: {
        email: {
          in: SUPER_ADMIN_EMAILS
        }
      },
      data: {
        role: UserRole.SUPER_ADMIN
      }
    });
    console.log(`Updated ${superAdminResult.count} super admin users`);
    
    // Update admins
    const adminResult = await prisma.user.updateMany({
      where: {
        email: {
          in: ADMIN_EMAILS
        }
      },
      data: {
        role: UserRole.ADMIN
      }
    });
    console.log(`Updated ${adminResult.count} admin users`);
    
    // Update moderators
    const moderatorResult = await prisma.user.updateMany({
      where: {
        email: {
          in: MODERATOR_EMAILS
        }
      },
      data: {
        role: UserRole.MODERATOR
      }
    });
    console.log(`Updated ${moderatorResult.count} moderator users`);
    
    // Verify all users have a role (should be USER by default)
    const usersWithoutRole = await prisma.user.findMany({
      where: {
        role: null
      },
      select: {
        id: true,
        email: true
      }
    });
    
    if (usersWithoutRole.length > 0) {
      console.warn(`Found ${usersWithoutRole.length} users without a role. Setting them to USER role.`);
      
      const fixResult = await prisma.user.updateMany({
        where: {
          id: {
            in: usersWithoutRole.map((user: UserWithId) => user.id)
          }
        },
        data: {
          role: UserRole.USER
        }
      });
      
      console.log(`Fixed ${fixResult.count} users by setting their role to USER`);
    } else {
      console.log('All users have a role assigned');
    }
    
    console.log('User role update completed successfully');
  } catch (error) {
    console.error('Error updating user roles:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update function
updateUserRoles()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 