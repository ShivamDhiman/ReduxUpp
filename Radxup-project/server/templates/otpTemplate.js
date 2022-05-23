module.exports.getSendOtpTemplate = (userData) => {
  return new Promise((resolve, reject) => {
    let templateBody = `<!DOCTYPE html>
    <html>
       <head>
          <title></title>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <style type="text/css">
             @media screen {
             @font-face {
             font-family: "Lato";
             font-style: normal;
             font-weight: 400;
             src: local("Lato Regular"), local("Lato-Regular"),
             url("https://fonts.gstatic.com/s/lato/v11/qIIYRU-oROkIk8vfvxw6QvesZW2xOQ-xsNqO47m55DA.woff")
             format("woff");
             }
             @font-face {
             font-family: "Lato";
             font-style: normal;
             font-weight: 700;
             src: local("Lato Bold"), local("Lato-Bold"),
             url("https://fonts.gstatic.com/s/lato/v11/qdgUG4U09HnJwhYI-uK18wLUuEpTyoUstqEm5AMlJo4.woff")
             format("woff");
             }
             @font-face {
             font-family: "Lato";
             font-style: italic;
             font-weight: 400;
             src: local("Lato Italic"), local("Lato-Italic"),
             url("https://fonts.gstatic.com/s/lato/v11/RYyZNoeFgb0l7W3Vu1aSWOvvDin1pK8aKteLpeZ5c0A.woff")
             format("woff");
             }
             @font-face {
             font-family: "Lato";
             font-style: italic;
             font-weight: 700;
             src: local("Lato Bold Italic"), local("Lato-BoldItalic"),
             url("https://fonts.gstatic.com/s/lato/v11/HkF_qI1x_noxlxhrhMQYELO3LdcAZYWl9Si6vvxL-qU.woff")
             format("woff");
             }
             }
             /* CLIENT-SPECIFIC STYLES */
             body,
             table,
             td,
             a {
             -webkit-text-size-adjust: 100%;
             -ms-text-size-adjust: 100%;
             }
             table,
             td {
             mso-table-lspace: 0pt;
             mso-table-rspace: 0pt;
             }
             img {
             -ms-interpolation-mode: bicubic;
             }
             /* RESET STYLES */
             img {
             border: 0;
             height: auto;
             line-height: 100%;
             outline: none;
             text-decoration: none;
             }
             body {
             height: 100% !important;
             margin: 0 !important;
             padding: 0 !important;
             width: 100% !important;
             }
             /* iOS BLUE LINKS */
             a[x-apple-data-detectors] {
             color: inherit !important;
             text-decoration: none !important;
             font-size: inherit !important;
             font-family: inherit !important;
             font-weight: inherit !important;
             line-height: inherit !important;
             }
             /* MOBILE STYLES */
             @media screen and (max-width:600px) {
             h1 {
             font-size: 32px !important;
             line-height: 32px !important;
             }
             }
             /* ANDROID CENTER FIX */
             div[style*="margin: 16px 0;"] {
             margin: 0 !important;
             }
          </style>
       </head>
       <body style="background: #e5e5ea; margin: 0 !important; padding: 0 !important">
          <!-- HIDDEN PREHEADER TEXT -->
          <div
             style="
             display: none;
             font-size: 1px;
             color: #fefefe;
             line-height: 1px;
             font-family: 'Lato', Helvetica, Arial, sans-serif;
             max-height: 0px;
             max-width: 0px;
             opacity: 0;
             overflow: hidden;
             "
             >
             We're thrilled to have you here! Get ready to dive into your new account.
          </div>
          <table
             border="0"
             cellpadding="0"
             cellspacing="0"
             width="100%"
             style="width: 100%; max-width: 700px;margin: 0 auto;"
             >
             <tr>
                <td bgcolor="#E5E5EA" align="center">
                   <table
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      width="100%"
                      style="max-width: 600px"
                      >
                      <tr>
                         <td
                            align="center"
                            valign="top"
                            style="position: relative; padding: 0 10px 25px 10px"
                            >
                            <img src="https://radxup.blob.core.windows.net/radxup-dev/logo.png" alt="RADxUP" />
                            <div
                               style="
                               position: absolute;
                               top: 100%;
                               left: 50%;
                               transform: translateX(-50%);
                               width: 0;
                               height: 0;
                               border-top: 50px solid #e5e5ea;
                               border-left: 50px solid transparent;
                               border-right: 50px solid transparent;
                               "
                               ></div>
                         </td>
                      </tr>
                   </table>
                </td>
             </tr>
             <tr>
                <td bgcolor="#14A9A2" align="center" style="padding: 0px 10px 0px 10px">
                   <table
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      width="100%"
                      style="max-width: 600px"
                      >
                      <tr>
                         <td
                            bgcolor="#14A9A2"
                            align="center"
                            valign="top"
                            style="
                            padding: 0px 20px 0px 20px;
                            border-radius: 4px 4px 0px 0px;
                            color: #111111;
                            font-family: 'Lato', Helvetica, Arial, sans-serif;
                            font-size: 48px;
                            font-weight: 400;
                            letter-spacing: 4px;
                            line-height: 48px;
                            "
                            >
                            <h6 style="color: #ffffff; letter-spacing: 1px">
                               Welcome to the Access to COVID-19 Testing in Marginalized Communities Study
                            </h6>
                         </td>
                      </tr>
                   </table>
                </td>
             </tr>
             <tr style="border: 1px solid">
                <td bgcolor="#ffffff" align="center" style="width: 100%">
                   <table
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      width="100%"
                      style="max-width: 900px"
                      >
                      <tr style="border: 1px solid black">
                         <td
                            bgcolor="#ffffff"
                            align="left"
                            style="
                            padding: 20px 30px 40px 30px;
                            color: #666666;
                            font-family: 'Lato', Helvetica, Arial, sans-serif;
                            font-size: 16px;
                            font-weight: 400;
                            line-height: 25px;
                            "
                            >
                            <h4>Hi ${userData.first_name}</h4>
                            <p>Use the following OTP to set your password</p>
                            <p style="margin: 40px 0">
                               Thank you in advance for your participation.
                            </p>
                         </td>
                      </tr>
                   </table>
                </td>
             </tr>
             <tr>
             <td bgcolor="#ffffff" align="left">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                         <td bgcolor="#ffffff" align="center" style="padding: 0px 30px 30px 30px;">
                              <table border="0" cellspacing="0" cellpadding="0">
                                  <tr>
                                      <td align="center" style="border-radius: 3px; font-size: 20px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 10px 15px; border-radius: 2px; border: 1px solid #0076BE; display: inline-block;" bgcolor="#0076BE">${userData.OTP}</td>
                                  </tr>
                              </table>
                         </td>
                      </tr>
                  </table>
             </td>
            </tr>
             <tr style="border: 1px solid">
                <td
                   bgcolor="#F9F9F9"
                   align="center"
                   style="
                   width: 100%;
                   padding: 30px;
                   color: #d6d6d6;
                   font-family: 'Lato', Helvetica, Arial, sans-serif;
                   font-size: 18px;
                   font-weight: 400;
                   line-height: 25px;
                   "
                   >
                   <table
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      width="100%"
                      style="max-width: 700px"
                      >
                      <tr>
                         <td align="center" valign="top">
                            <img style="width: 40px" src="./Quotes.svg" alt="" />
                         </td>
                      </tr>
                      <tr>
                         <td style="padding: 0 50px; text-align: center">
                            <p>
                               <a href="https://radx-up.org/colectiv/">Powered by RADxUP</a>
                            </p>
                         </td>
                      </tr>
                   </table>
                </td>
             </tr>
             <tr>
                <td bgcolor="#00539B" align="center" style="padding: 0px 10px 0px 10px">
                   <table
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      width="100%"
                      style="max-width: 900px"
                      >
                      <tr>
                         <td
                            bgcolor="#00539B"
                            align="left"
                            style="
                            padding: 20px 30px;
                            color: #ffffff;
                            font-family: 'Lato', Helvetica, Arial, sans-serif;
                            font-size: 12px;
                            line-height: 18px;
                            "
                            >
                            <p>&copy; All rights reserved</p>
                         </td>
                         <td
                            bgcolor="#00539B"
                            align="right"
                            style="
                            padding: 20px 30px;
                            color: #ffffff;
                            font-family: 'Lato', Helvetica, Arial, sans-serif;
                            font-size: 12px;
                            line-height: 18px;
                            "
                            >
                            <ul style="list-style: none">
                               <li style="display: inline; margin: 0 10px">
                                  <a href="">
                                  <img src="https://radxup.blob.core.windows.net/radxup-dev/twitter.png" alt="Twitter" />
                                  </a>
                               </li>
                               <li style="display: inline; margin: 0 10px">
                                  <a href="">
                                  <img src="https://radxup.blob.core.windows.net/radxup-dev/facebook-f.png" alt="Facebook" />
                                  </a>
                               </li>
                               <li style="display: inline; margin: 0 10px">
                                  <a href="">
                                  <img src="https://radxup.blob.core.windows.net/radxup-dev/linkedin-in.png" alt="LinkedIn" />
                                  </a>
                               </li>
                               <li style="display: inline; margin: 0 10px">
                                  <a href="">
                                  <img src="https://radxup.blob.core.windows.net/radxup-dev/instagram.png" alt="Instagram" />
                                  </a>
                               </li>
                               <li style="display: inline; margin: 0 10px">
                                  <a href="">
                                  <img src="https://radxup.blob.core.windows.net/radxup-dev/youtube.png" alt="Youtube" />
                                  </a>
                               </li>
                            </ul>
                         </td>
                      </tr>
                   </table>
                </td>
             </tr>
          </table>
       </body>
    </html>`;

    resolve(templateBody);
  });
}
