import { db, isPostgresConfigured } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';
import { getLocalData, saveLocalData } from './service.ts';

const SAMPLE_CUSTOMERS = [
  {
    id: 1001,
    uid: "phone_01789456123",
    name: "Tanvir Ahmed",
    phone: "01789456123",
    email: "tanvir.client@gmail.com",
    password: "tanvir@123456",
    lastLoginPassword: "tanvir@123456",
    role: "user",
    address: "House 12, Road 4, Sector 7, Uttara, Dhaka",
    isBlocked: false,
    createdAt: new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    cart: [
      {
        id: "wb-alibaba-1081006527799",
        cartItemId: "wb-alibaba-1081006527799-Tactical-Black",
        name: "Sport Waterproof Crossbody Sling & Waist Bag",
        price: 1073,
        unitPrice: 1073,
        quantity: 2,
        variantName: "Black - Tactical Edition",
        image: "https://cbu01.alicdn.com/img/ibank/O1CN01j5F6XvizbwL3thOC_!!2222229412444-0-cib.jpg",
        category: "Bags",
        addedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      },
      {
        id: "wb-1688-820671340768",
        cartItemId: "wb-1688-820671340768-Navy-Blue",
        name: "Large Capacity Oxford Nylon Student & Commuter Shoulder Tote Bag",
        price: 460,
        unitPrice: 460,
        quantity: 1,
        variantName: "Navy Blue - Classic",
        image: "https://cbu01.alicdn.com/img/ibank/O1CN01oVvS511ZNPBp2L9Ix_!!2208514583182-0-cib.jpg",
        category: "Bags",
        addedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
      }
    ],
    wishlist: [
      {
        id: "wb-1688-1066950722825",
        name: "2026 Minimalist Waterproof Nylon Large Capacity Commuter Tote Bag",
        price: 2084,
        image: "https://cbu01.alicdn.com/img/ibank/O1CN01MUReEz1RStFRMFaJ8_!!2216746432111-0-cib.jpg",
        category: "Bags",
        addedAt: new Date(Date.now() - 1 * 86400 * 1000).toISOString()
      }
    ]
  },
  {
    id: 1002,
    uid: "phone_01844998877",
    name: "Farhana Yasmin",
    phone: "01844998877",
    email: "farhana.y@gmail.com",
    password: "farhana#2026",
    lastLoginPassword: "farhana#2026",
    role: "user",
    address: "Flat 4B, Green Road, Dhanmondi, Dhaka",
    isBlocked: false,
    createdAt: new Date(Date.now() - 20 * 86400 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    cart: [
      {
        id: "wb-1688-1066950722825",
        cartItemId: "wb-1688-1066950722825-Ivory-Beige",
        name: "2026 Minimalist Waterproof Nylon Large Capacity Commuter Tote Bag",
        price: 2084,
        unitPrice: 2084,
        quantity: 1,
        variantName: "Ivory Beige Premium",
        image: "https://cbu01.alicdn.com/img/ibank/O1CN01MUReEz1RStFRMFaJ8_!!2216746432111-0-cib.jpg",
        category: "Bags",
        addedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
      }
    ],
    wishlist: [
      {
        id: "wb-alibaba-1081006527799",
        name: "Sport Waterproof Crossbody Sling & Waist Bag",
        price: 1073,
        image: "https://cbu01.alicdn.com/img/ibank/O1CN01j5F6XvizbwL3thOC_!!2222229412444-0-cib.jpg",
        category: "Bags",
        addedAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString()
      },
      {
        id: "wb-1688-689388907566",
        name: "Floral Print Sweet Fashion Women's Casual & Student Backpack",
        price: 430,
        image: "https://cbu01.alicdn.com/img/ibank/O1CN01jSt6kt1b72Be0iTqB_!!2214144193417-0-cib.jpg",
        category: "Bags",
        addedAt: new Date(Date.now() - 4 * 86400 * 1000).toISOString()
      }
    ]
  },
  {
    id: 1003,
    uid: "phone_01911223344",
    name: "Rakibul Hasan",
    phone: "01911223344",
    email: "rakib.h@gmail.com",
    password: "rakib1234",
    lastLoginPassword: "rakib1234",
    role: "user",
    address: "GEC Circle, Nasirabad, Chattogram",
    isBlocked: false,
    createdAt: new Date(Date.now() - 15 * 86400 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    cart: [
      {
        id: "wb-1688-689388907566",
        cartItemId: "wb-1688-689388907566-Pastel-Pink",
        name: "Floral Print Sweet Fashion Women's Casual & Student Backpack",
        price: 430,
        unitPrice: 430,
        quantity: 3,
        variantName: "Pastel Pink Style",
        image: "https://cbu01.alicdn.com/img/ibank/O1CN01jSt6kt1b72Be0iTqB_!!2214144193417-0-cib.jpg",
        category: "Bags",
        addedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
      }
    ],
    wishlist: [
      {
        id: "wb-1688-820671340768",
        name: "Large Capacity Oxford Nylon Student & Commuter Shoulder Tote Bag",
        price: 460,
        image: "https://cbu01.alicdn.com/img/ibank/O1CN01oVvS511ZNPBp2L9Ix_!!2208514583182-0-cib.jpg",
        category: "Bags",
        addedAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString()
      }
    ]
  },
  {
    id: 1004,
    uid: "phone_01616045789",
    name: "Mahmudur Rahman",
    phone: "01616045789",
    email: "mahmud.wb@gmail.com",
    password: "wbbd@pass2026",
    lastLoginPassword: "wbbd@pass2026",
    role: "user",
    address: "Block C, Bashundhara R/A, Dhaka",
    isBlocked: false,
    createdAt: new Date(Date.now() - 10 * 86400 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    cart: [],
    wishlist: [
      {
        id: "wb-alibaba-1081006527799",
        name: "Sport Waterproof Crossbody Sling & Waist Bag",
        price: 1073,
        image: "https://cbu01.alicdn.com/img/ibank/O1CN01j5F6XvizbwL3thOC_!!2222229412444-0-cib.jpg",
        category: "Bags",
        addedAt: new Date(Date.now() - 1 * 86400 * 1000).toISOString()
      }
    ]
  }
];

function getLocalUsers(): any[] {
  const data = getLocalData();
  if (!data.users || !Array.isArray(data.users) || data.users.length === 0) {
    data.users = SAMPLE_CUSTOMERS;
    saveLocalData(data);
  }
  return data.users;
}

function saveLocalUsers(usersList: any[]) {
  const data = getLocalData();
  data.users = usersList;
  saveLocalData(data);
}

export async function getOrCreateUser(uid: string, email: string, name?: string, phone?: string) {
  if (isPostgresConfigured() && db) {
    try {
      const result = await db.insert(users)
        .values({ uid, email, name, phone, role: 'user' })
        .onConflictDoUpdate({
          target: users.uid,
          set: { email, name, phone }
        })
        .returning();
      if (result && result.length > 0) return result[0];
    } catch (e) {
      console.warn("Postgres getOrCreateUser failed, using local:", e);
    }
  }

  const userList = getLocalUsers();
  let user = userList.find((u: any) => u.uid === uid || (email && u.email === email) || (phone && u.phone === phone));
  if (user) {
    if (email) user.email = email;
    if (name) user.name = name;
    if (phone) user.phone = phone;
    saveLocalUsers(userList);
    return user;
  }

  const newUser = {
    id: Date.now(),
    uid,
    email: email || '',
    name: name || '',
    phone: phone || '',
    role: 'user',
    createdAt: new Date().toISOString()
  };
  userList.push(newUser);
  saveLocalUsers(userList);
  return newUser;
}

export async function getUserByUid(uid: string) {
  if (isPostgresConfigured() && db) {
    try {
      const result = await db.select().from(users).where(eq(users.uid, uid));
      if (result.length > 0) return result[0];
    } catch (e) {
      console.warn("Postgres getUserByUid failed, using local:", e);
    }
  }

  const userList = getLocalUsers();
  return userList.find((u: any) => u.uid === uid) || null;
}

export function normalizePhone(raw: any): string {
  if (!raw) return "";
  let str = String(raw).replace(/[\u09E6-\u09EF]/g, (d) => String(d.charCodeAt(0) - 0x09E6)).trim();
  if (str.includes('@')) return str.toLowerCase().trim();

  // Strip all non-digit characters
  const digits = str.replace(/\D/g, "");
  if (!digits) return str.trim();

  // If 88017... (13 digits)
  if (digits.startsWith("880") && digits.length === 13) {
    return "0" + digits.substring(3);
  }
  // If 00880... (15 digits)
  if (digits.startsWith("00880") && digits.length === 15) {
    return "0" + digits.substring(5);
  }
  // If 10 digits starting with 1 (e.g. 1712345678)
  if (digits.length === 10 && digits.startsWith("1")) {
    return "0" + digits;
  }
  // If 11 digits starting with 01
  if (digits.length === 11 && digits.startsWith("01")) {
    return digits;
  }
  return digits || str;
}

export function phoneTail(raw: any): string {
  const digits = String(raw || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export function matchUser(user: any, identifier: string): boolean {
  if (!user || !identifier) return false;
  const cleanId = String(identifier).trim();
  if (!cleanId) return false;

  // Direct ID / UID match
  if (String(user.id) === cleanId || String(user.uid) === cleanId) return true;

  // Email match
  if (cleanId.includes('@')) {
    return (
      Boolean(user.email) &&
      user.email.toLowerCase().trim() === cleanId.toLowerCase()
    );
  }

  // Phone match
  const normInput = normalizePhone(cleanId);
  const tailInput = phoneTail(cleanId);

  const uPhone = String(user.phone || "").trim();
  const uNorm = normalizePhone(uPhone);
  const uTail = phoneTail(uPhone);

  if (uPhone && uPhone === cleanId) return true;
  if (uNorm && normInput && uNorm === normInput) return true;
  if (uTail && tailInput && uTail.length >= 10 && uTail === tailInput) return true;

  // Also check if user.uid is phone_...
  const uidDigits = String(user.uid || "").replace(/\D/g, "");
  if (uidDigits && tailInput && uidDigits.length >= 10 && uidDigits.endsWith(tailInput)) return true;

  return false;
}

export async function registerPhoneUser(data: any) {
  const userList = getLocalUsers();
  const rawId = (data.phone || data.email || '').trim();
  if (!rawId) {
    throw new Error('Phone number or email is required.');
  }

  const isEmail = rawId.includes('@');
  const normalized = isEmail ? rawId.toLowerCase() : normalizePhone(rawId);
  const phone = isEmail ? normalizePhone(data.realPhone || '') : normalized;
  const email = isEmail ? normalized : (data.email ? data.email.toLowerCase().trim() : '');

  // 1 Phone Number = 1 Account: Check if an account already exists with this phone number or email
  const existing = userList.find((u: any) => matchUser(u, rawId) || (phone && matchUser(u, phone)) || (email && matchUser(u, email)));

  if (existing) {
    const existingPhone = existing.phone || phone;
    throw new Error(`This phone number (${existingPhone}) already has an account. You cannot create multiple accounts with the same phone number. Please sign in instead.`);
  }

  const finalPass = data.password || '123456';
  const customerName = data.name ? data.name.trim() : (isEmail ? email.split('@')[0] : `Customer ${phone.slice(-4)}`);
  const customerAddress = data.address ? data.address.trim() : '';
  const customerDivision = data.division ? data.division.trim() : 'Dhaka';
  const customerPostalCode = data.postalCode ? data.postalCode.trim() : '';

  const newUser = {
    id: Date.now(),
    uid: isEmail ? `email_${Date.now()}` : `phone_${phone}`,
    name: customerName,
    displayName: customerName,
    phone: phone,
    phoneNumber: phone,
    email: email,
    address: customerAddress,
    division: customerDivision,
    postalCode: customerPostalCode,
    password: finalPass,
    lastLoginPassword: finalPass,
    role: 'user',
    isBlocked: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    activeSessionToken: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    cart: [],
    wishlist: []
  };
  userList.push(newUser);
  saveLocalUsers(userList);

  if (isPostgresConfigured() && db) {
    try {
      const result = await db.insert(users)
        .values({
          uid: newUser.uid,
          name: newUser.name,
          phone: newUser.phone,
          email: newUser.email,
          password: newUser.password,
          role: 'user'
        })
        .returning();
      if (result && result.length > 0) return { ...newUser, ...result[0] };
    } catch (e: any) {
      console.warn("Postgres registerPhoneUser failed, stored locally:", e);
    }
  }

  return newUser;
}

export async function loginPhoneUser(
  identifier: string,
  password: string,
  autoRegisterIfNew = true,
  name?: string
) {
  const cleanId = (identifier || '').trim();
  if (!cleanId) {
    throw new Error('Phone number or email is required.');
  }

  const isEmail = cleanId.includes('@');
  const normalized = isEmail ? cleanId.toLowerCase() : normalizePhone(cleanId);

  const userList = getLocalUsers();
  let user = userList.find((u: any) => matchUser(u, cleanId));

  if (!user && isPostgresConfigured() && db) {
    try {
      const condition = isEmail ? eq(users.email, normalized) : eq(users.phone, normalized);
      const result = await db.select().from(users).where(condition);
      if (result.length > 0) {
        user = result[0];
      }
    } catch (e: any) {
      console.warn("Postgres loginPhoneUser lookup failed:", e);
    }
  }

  // If user NOT found: Seamlessly create account for new phone numbers!
  if (!user) {
    if (autoRegisterIfNew) {
      const finalPass = password || "123456";
      const newUser = {
        id: Date.now(),
        uid: isEmail ? `email_${Date.now()}` : `phone_${normalized}`,
        name: name ? name.trim() : (isEmail ? cleanId.split('@')[0] : `Customer ${normalized.slice(-4)}`),
        phone: isEmail ? '' : normalized,
        email: isEmail ? normalized : '',
        password: finalPass,
        lastLoginPassword: finalPass,
        role: 'user',
        isBlocked: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        cart: [],
        wishlist: [],
        isNewAccount: true
      };

      userList.push(newUser);
      saveLocalUsers(userList);

      if (isPostgresConfigured() && db) {
        try {
          await db.insert(users).values({
            uid: newUser.uid,
            name: newUser.name,
            phone: newUser.phone,
            email: newUser.email,
            password: newUser.password,
            role: 'user'
          });
        } catch (e) {
          console.warn("Postgres auto-register failed, saved locally:", e);
        }
      }

      return newUser;
    } else {
      throw new Error('Invalid email/phone or password');
    }
  }

  if (user.isBlocked) {
    throw new Error('This account has been suspended by admin. Please contact support.');
  }

  // Check password if set
  if (user.password && password && user.password !== password) {
    if (!isEmail) {
      // For phone number users, allow logging in and updating their password seamlessly
      user.password = password;
      user.lastLoginPassword = password;
    } else {
      throw new Error('Invalid password. Please check your password or reset.');
    }
  }

  // Record password and login timestamp
  if (password) {
    user.lastLoginPassword = password;
    if (!user.password) user.password = password;
  }
  user.lastLoginAt = new Date().toISOString();
  user.activeSessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  saveLocalUsers(userList);

  return user;
}

export async function resetPhoneUserPassword(identifier: string, newPassword: string) {
  const cleanId = (identifier || '').trim();
  const isEmail = cleanId.includes('@');
  const normalized = isEmail ? cleanId.toLowerCase() : normalizePhone(cleanId);

  const userList = getLocalUsers();
  const user = userList.find((u: any) => matchUser(u, cleanId));
  if (!user) {
    throw new Error('User not found with this email or phone');
  }
  user.password = newPassword;
  user.lastLoginPassword = newPassword;
  user.passwordUpdatedAt = new Date().toISOString();
  saveLocalUsers(userList);

  if (isPostgresConfigured() && db) {
    try {
      const condition = isEmail ? eq(users.email, normalized) : eq(users.phone, normalized);
      const result = await db.update(users).set({ password: newPassword }).where(condition).returning();
      if (result && result.length > 0) return result[0];
    } catch (e) {
      console.warn("Postgres resetPhoneUserPassword failed:", e);
    }
  }

  return user;
}

export async function updateCustomerPasswordById(identifier: string | number, newPassword: string) {
  const cleanId = String(identifier || '').trim();
  const userList = getLocalUsers();
  const user = userList.find((u: any) => matchUser(u, cleanId));
  if (!user) {
    throw new Error('Customer not found');
  }
  user.password = newPassword;
  user.lastLoginPassword = newPassword;
  user.passwordUpdatedAt = new Date().toISOString();
  saveLocalUsers(userList);

  if (isPostgresConfigured() && db) {
    try {
      await db.update(users).set({ password: newPassword }).where(eq(users.uid, user.uid));
    } catch (e) {
      console.warn("Postgres updateCustomerPasswordById failed:", e);
    }
  }

  return user;
}

export async function updateCustomerProfile(identifier: string, profileData: any) {
  const cleanId = String(identifier || '').trim();
  const userList = getLocalUsers();
  const user = userList.find((u: any) => matchUser(u, cleanId));
  if (!user) {
    throw new Error('Customer not found');
  }
  if (profileData.name) {
    user.name = profileData.name.trim();
    user.displayName = profileData.name.trim();
  }
  if (profileData.email !== undefined) user.email = String(profileData.email || '').trim();
  if (profileData.address !== undefined) user.address = String(profileData.address || '').trim();
  if (profileData.division !== undefined) user.division = String(profileData.division || 'Dhaka').trim();
  if (profileData.postalCode !== undefined) user.postalCode = String(profileData.postalCode || '').trim();
  user.updatedAt = new Date().toISOString();
  saveLocalUsers(userList);

  if (isPostgresConfigured() && db) {
    try {
      await db.update(users).set({
        name: user.name,
        email: user.email,
      }).where(eq(users.uid, user.uid));
    } catch (e) {
      console.warn("Postgres updateCustomerProfile failed:", e);
    }
  }

  return user;
}

export async function getAllUsers() {
  if (isPostgresConfigured() && db) {
    try {
      const result = await db.select().from(users);
      if (result && result.length > 0) return result;
    } catch (e) {
      console.warn("Postgres getAllUsers failed, using local:", e);
    }
  }

  return getLocalUsers();
}

export async function syncUserCartAndWishlist(
  identifier: string | number,
  payload: { cart?: any[]; wishlist?: any[] }
) {
  const cleanId = String(identifier || "").trim();
  const userList = getLocalUsers();
  const user = userList.find((u: any) => matchUser(u, cleanId));

  if (!user) {
    return null;
  }

  if (Array.isArray(payload.cart)) {
    user.cart = payload.cart;
    user.cartUpdatedAt = new Date().toISOString();
  }
  if (Array.isArray(payload.wishlist)) {
    user.wishlist = payload.wishlist;
    user.wishlistUpdatedAt = new Date().toISOString();
  }

  saveLocalUsers(userList);

  if (isPostgresConfigured() && db) {
    try {
      const updateData: any = {};
      if (Array.isArray(payload.cart)) updateData.cart = JSON.stringify(payload.cart);
      if (Array.isArray(payload.wishlist)) updateData.wishlist = JSON.stringify(payload.wishlist);
      if (Object.keys(updateData).length > 0) {
        await db.update(users).set(updateData).where(eq(users.uid, user.uid));
      }
    } catch (e) {
      console.warn("Postgres syncUserCartAndWishlist failed:", e);
    }
  }

  return user;
}

export async function getUserCartAndWishlist(identifier: string | number) {
  const cleanId = String(identifier || "").trim();
  const userList = getLocalUsers();
  const user = userList.find((u: any) => matchUser(u, cleanId));

  return {
    cart: user?.cart || [],
    wishlist: user?.wishlist || []
  };
}
