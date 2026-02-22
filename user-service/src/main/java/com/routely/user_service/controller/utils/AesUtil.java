package com.routely.user_service.controller.utils;

import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

public class AesUtil {

    // Key must be 16/24/32 bytes for AES
    private static final String SECRET_KEY = "MySuperSecretKey"; // 16-char = 128-bit key
    private static final String AES_ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int GCM_IV_LENGTH = 12;

    // Encrypt the JWT token
    public static String encrypt(String plainText) throws Exception {
        byte[] iv = new byte[GCM_IV_LENGTH];
        new SecureRandom().nextBytes(iv);

        Cipher cipher = Cipher.getInstance(AES_ALGORITHM);
        SecretKeySpec keySpec = new SecretKeySpec(SECRET_KEY.getBytes(), "AES");
        GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);

        cipher.init(Cipher.ENCRYPT_MODE, keySpec, spec);
        byte[] encrypted = cipher.doFinal(plainText.getBytes());

        byte[] encryptedWithIv = new byte[GCM_IV_LENGTH + encrypted.length];
        System.arraycopy(iv, 0, encryptedWithIv, 0, GCM_IV_LENGTH);
        System.arraycopy(encrypted, 0, encryptedWithIv, GCM_IV_LENGTH, encrypted.length);

        return Base64.getEncoder().encodeToString(encryptedWithIv);
    }

    // Decrypt the JWT token
    public static String decrypt(String cipherText) throws Exception {
        byte[] encryptedWithIv = Base64.getDecoder().decode(cipherText);

        byte[] iv = new byte[GCM_IV_LENGTH];
        byte[] encrypted = new byte[encryptedWithIv.length - GCM_IV_LENGTH];

        System.arraycopy(encryptedWithIv, 0, iv, 0, GCM_IV_LENGTH);
        System.arraycopy(encryptedWithIv, GCM_IV_LENGTH, encrypted, 0, encrypted.length);

        Cipher cipher = Cipher.getInstance(AES_ALGORITHM);
        SecretKeySpec keySpec = new SecretKeySpec(SECRET_KEY.getBytes(), "AES");
        GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);

        cipher.init(Cipher.DECRYPT_MODE, keySpec, spec);
        byte[] decrypted = cipher.doFinal(encrypted);

        return new String(decrypted);
    }
}
