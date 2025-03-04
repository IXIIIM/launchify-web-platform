  linkedinUrl: z.string().url().optional(),
  features: z.array(z.string()).min(1).max(5),
  industries: z.array(z.string()).min(1),
  yearsExperience: z.number().min(0),
  businessType: z.enum(['B2B', 'B2C']),
  desiredInvestment: z.object({
    amount: z.number().min(0),
    timeframe: z.string()
  }),
  profitabilityTimeframe: z.string()
});

const funderProfileSchema = z.object({
  name: z.string().min(2),
  logo: z.string().optional(),
  photo: z.string().optional(),
  taxId: z.string(),
  companyWebsite: z.string().url().optional(),
  linkedinUrl: z.string().url().optional(),
  availableFunds: z.number().min(0),
  areasOfInterest: z.array(z.string()).min(1),
  yearsExperience: z.number().min(0),
  investmentPreferences: z.object({
    timeframe: z.string(),
    commitmentLength: z.string()
  }),
  certifications: z.array(z.enum([
    'SmallBusiness',
    'MinorityOwned',
    'WomenOwned',
    'GreenFriendly'
  ]))
});

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        entrepreneurProfile: true,
        funderProfile: true,
        subscription: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Track profile view if viewing another user's profile
    if (req.query.userId && req.query.userId !== req.user.id) {
      await usageService.trackProfileView(req.query.userId as string);
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      subscriptionTier: user.subscriptionTier,
      verificationLevel: user.verificationLevel,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      profile: user.userType === 'entrepreneur' 
        ? user.entrepreneurProfile 
        : user.funderProfile,
      subscription: user.subscription[0]
    });
  } catch (error) {
    throw error;
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Validate profile data based on user type
    const profileData = user.userType === 'entrepreneur'
      ? entrepreneurProfileSchema.parse(req.body)
      : funderProfileSchema.parse(req.body);

    // Handle file uploads if present
    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (files.photo) {
        profileData.photo = await storageService.replaceProfileImage(
          files.photo[0].buffer,
          user.id,
          profileData.photo
        );
      }

      if (files.logo) {
        profileData.logo = await storageService.replaceCompanyLogo(
          files.logo[0].buffer,
          user.id,
          profileData.logo
        );
      }
    }

    // Update profile based on user type
    if (user.userType === 'entrepreneur') {
      await prisma.entrepreneurProfile.upsert({
        where: { userId: user.id },
        update: profileData,
        create: {
          ...profileData,
          userId: user.id
        }
      });
    } else {
      await prisma.funderProfile.upsert({
        where: { userId: user.id },
        update: profileData,
        create: {
          ...profileData,
          userId: user.id
        }
      });
    }

    res.json({
      message: 'Profile updated successfully',
      profile: profileData
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw error;
  }
};

export const updateProfilePhoto = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      throw new ValidationError('Validation failed', [{
        field: 'photo',
        message: 'Photo is required'
      }]);
    }

    const photoUrl = await storageService.replaceProfileImage(
      req.file.buffer,
      req.user.id,
      req.user.profile?.photo
    );

    // Update profile photo based on user type
    if (req.user.userType === 'entrepreneur') {
      await prisma.entrepreneurProfile.update({
        where: { userId: req.user.id },
        data: { photo: photoUrl }
      });
    } else {
      await prisma.funderProfile.update({
        where: { userId: req.user.id },
        data: { photo: photoUrl }
      });
    }

    res.json({
      message: 'Profile photo updated successfully',
      photoUrl
    });
  } catch (error) {
    throw error;
  }
};

export const updateCompanyLogo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      throw new ValidationError('Validation failed', [{
        field: 'logo',
        message: 'Logo is required'
      }]);
    }

    const logoUrl = await storageService.replaceCompanyLogo(
      req.file.buffer,
      req.user.id,
      req.user.profile?.logo
    );

    // Update company logo based on user type
    if (req.user.userType === 'entrepreneur') {
      await prisma.entrepreneurProfile.update({
        where: { userId: req.user.id },
        data: { logo: logoUrl }
      });
    } else {
      await prisma.funderProfile.update({
        where: { userId: req.user.id },
        data: { logo: logoUrl }
      });
    }

    res.json({
      message: 'Company logo updated successfully',
      logoUrl
    });
  } catch (error) {
    throw error;
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settingsSchema = z.object({
      emailNotifications: z.object({
        matches: z.boolean(),
        messages: z.boolean(),
        updates: z.boolean()
      }),
      pushNotifications: z.object({
        matches: z.boolean(),
        messages: z.boolean(),
        updates: z.boolean()
      }),
      theme: z.enum(['light', 'dark']),
      language: z.string(),
      timezone: z.string()
    });

    const validatedData = settingsSchema.parse(req.body);

    await prisma.userSettings.upsert({
      where: { userId: req.user.id },
      update: validatedData,
      create: {
        ...validatedData,
        userId: req.user.id
      }
    });

    res.json({
      message: 'Settings updated successfully',
      settings: validatedData
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw error;
  }
};

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: req.user.id }
    });

    res.json(settings || {
      emailNotifications: { matches: true, messages: true, updates: true },
      pushNotifications: { matches: true, messages: true, updates: false },
      theme: 'light',
      language: 'en',
      timezone: 'UTC'
    });
  } catch (error) {
    throw error;
  }
};

export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    const passwordSchema = z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d)/, {
        message: 'Password must contain at least one letter and one number'
      })
    });

    const validatedData = passwordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const validPassword = await bcrypt.compare(validatedData.currentPassword, user.password);
    if (!validPassword) {
      throw new ValidationError('Validation failed', [{
        field: 'currentPassword',
        message: 'Current password is incorrect'
      }]);
    }

    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw error;
  }
};