package com.estel.webpush.controller;

import nl.martijndwars.webpush.Base64Encoder;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import nl.martijndwars.webpush.Utils;
import org.apache.http.HttpResponse;
import org.apache.http.HttpStatus;
import org.bouncycastle.jce.ECNamedCurveTable;
import org.bouncycastle.jce.interfaces.ECPrivateKey;
import org.bouncycastle.jce.interfaces.ECPublicKey;
import org.bouncycastle.jce.spec.ECNamedCurveParameterSpec;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.security.KeyPair;
import java.security.KeyPairGenerator;

import static nl.martijndwars.webpush.Utils.ALGORITHM;
import static nl.martijndwars.webpush.Utils.CURVE;
import static org.bouncycastle.jce.provider.BouncyCastleProvider.PROVIDER_NAME;

@Controller
@RequestMapping("/")
public class SubscribeController {

	private String publicKey = "";
	private String privateKey = "";

	@RequestMapping("/getKey")
	@ResponseBody
	public String getKey(){
		generateKeys();
		return this.publicKey;
	}

	@RequestMapping("/push")
	@ResponseBody
	public String push(@RequestBody Subscription subscription){
		try {
			Notification notification = new Notification(subscription,"From Push Server!");
			PushService pushService = new PushService();
//			pushService.setPublicKey(Utils.loadPublicKey("BGl4xCE-w3XVGeX5F2fSvNTTuyMT-cfPf9qYf1b8tJc9mO3Y2P9FcEH7JVzBlcolwJ2Vgg7JNwvfWyzsj-xBe90="));
//			pushService.setPrivateKey(Utils.loadPrivateKey("V6pWDEb6vldP8TvSo25G2uco2A9AbP92-MakZdvbnFk="));
			pushService.setPublicKey(Utils.loadPublicKey(this.publicKey));
			pushService.setPrivateKey(Utils.loadPrivateKey(this.privateKey));
			HttpResponse httpResponse = pushService.send(notification);

			int statusCode = httpResponse.getStatusLine().getStatusCode();
			System.out.println(statusCode);
			if(statusCode == HttpStatus.SC_CREATED || statusCode == HttpStatus.SC_OK){
				return "Push Succeeded";
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
		return "Push Failed";
	}

	private void generateKeys(){
		//rewrite web-push cli: https://github.com/web-push-libs/webpush-java
		try{
			ECNamedCurveParameterSpec parameterSpec = ECNamedCurveTable.getParameterSpec(CURVE);
			KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(ALGORITHM, PROVIDER_NAME);
			keyPairGenerator.initialize(parameterSpec);
			KeyPair keyPair = keyPairGenerator.generateKeyPair();

			ECPublicKey publicKey = (ECPublicKey) keyPair.getPublic();
			ECPrivateKey privateKey = (ECPrivateKey) keyPair.getPrivate();
			byte[] encodedPublicKey = Utils.encode(publicKey);
			byte[] encodedPrivateKey = Utils.encode(privateKey);

			this.publicKey = Base64Encoder.encodeUrl(encodedPublicKey);
			this.privateKey = Base64Encoder.encodeUrl(encodedPrivateKey);
		} catch (Exception e){
			e.printStackTrace();
		}
	}
}
