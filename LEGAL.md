# Rechtliche Hinweise / Legal notice / 法律声明

**Stand / Version:** 2026-10-24
**Gilt für / Applies to:** die Website (https://fau-studyinfo-navigator.pages.dev und
die GitHub-Pages-Spiegelung) sowie dieses Repository.

> Dieses Dokument beschreibt nach bestem Wissen, wie das Projekt arbeitet. Es ist
> keine Rechtsberatung und begründet keine Ansprüche. Verbindlich bleiben die
> offiziellen Dokumente der FAU und die gesetzlichen Vorschriften.

---

## 1. Anbieter und Charakter des Angebots

FAU Study Navigator ist ein **privates, nicht-kommerzielles studentisches
Hilfsmittel** zur Orientierung und Semesterplanung. Es handelt sich nicht um ein
Angebot der Friedrich-Alexander-Universität Erlangen-Nürnberg (FAU). Es besteht
keine Beauftragung, Kooperation, Mitwirkung oder Empfehlung durch die FAU.

Es werden keine Waren, Dienstleistungen oder kostenpflichtigen Funktionen
angeboten. Eine Impressumspflicht nach § 5 DDG besteht für rein private,
nicht-kommerzielle Angebote in der Regel nicht; die Kontaktaufnahme erfolgt über
das öffentliche GitHub-Repository.

**Kontakt:** https://github.com/tommy2345-art/FAU-Studyinfo-Navigator/issues

## 2. Keine kommerzielle Nutzung

- keine Werbung, keine Affiliate-Links, keine Sponsoring-Inhalte
- keine kostenpflichtigen Funktionen, keine Spendenaufrufe
- kein Verkauf, keine Vermietung und keine sonstige kommerzielle Verwertung von
  Daten
- keine Weitergabe von Daten an Werbenetzwerke oder Datenhändler
- die Betriebskosten trägt der Maintainer

Sollte sich dieser Charakter ändern, wird das vorher auf der Website und im
Repository angekündigt.

## 3. Datenschutz (DSGVO / BDSG)

### 3.1 Verantwortlicher

Verantwortlich im Sinne von Art. 4 Nr. 7 DSGVO ist der Maintainer des
GitHub-Repositories. Die Kontaktaufnahme ist über die dortigen Issues möglich.

### 3.2 Welche Daten verarbeitet werden

**Lokal im Browser (nicht auf einem Server):**
Sprache, Theme, Ressourcen-Favoriten, Studienwahl, Kurs- und Prüfungsdaten,
Aufgaben und hochgeladene Backups werden ausschließlich im lokalen Speicher des
Browsers (`localStorage`, `IndexedDB`) gehalten. Diese Daten werden **nicht an
einen Server übertragen**, es gibt keine Konten und keine Anmeldung.

**Beim Aufruf der Seite (Hosting):**
Die Auslieferung erfolgt über Cloudflare Pages und GitHub Pages. Die Anbieter
verarbeiten technisch notwendige Verbindungsdaten (u. a. IP-Adresse, Datum und
Uhrzeit, User-Agent, aufgerufene Ressource) zur Auslieferung und zur Abwehr von
Missbrauch. Auf diese Verarbeitung hat das Projekt keinen Einfluss; Einzelheiten
stehen in den Datenschutzhinweisen der Anbieter.

**Nicht verarbeitet:**
keine Analyse- oder Trackingdienste, keine Pixel, kein Fingerprinting, keine
Werbe-Cookies, keine Profilbildung, keine automatisierte
Entscheidungsfindung.

### 3.3 Rechtsgrundlagen

- Hosting-Zugriffsdaten: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an
  einer sicheren und funktionsfähigen Auslieferung).
- Lokale Speicherung im Endgerät: § 25 Abs. 2 Nr. 2 TDDDG (unbedingt
  erforderlich für die vom Nutzer ausdrücklich gewünschte Funktion) sowie
  Art. 6 Abs. 1 lit. b bzw. lit. f DSGVO.
- Es werden **keine** Einwilligungen für Analyse- oder Marketingzwecke
  eingeholt, weil solche Verarbeitung nicht stattfindet. Deshalb gibt es auch
  kein Cookie-Banner.

### 3.4 Empfänger und Drittlandübermittlung

Empfänger der technischen Zugriffsdaten sind die Hosting-Anbieter Cloudflare
und GitHub (Microsoft). Beide sind nach eigenen Angaben unter dem EU-US Data
Privacy Framework zertifiziert und/oder stützen Übermittlungen auf
Standardvertragsklauseln. Maßgeblich sind die Datenschutzhinweise der Anbieter.

Eine darüber hinausgehende Weitergabe an Dritte findet nicht statt, außer wenn
eine gesetzliche Verpflichtung besteht.

### 3.5 Speicherdauer

Lokale Daten bleiben gespeichert, bis sie im Browser gelöscht werden (Einstellungen
→ „Alle lokalen Daten löschen“ oder Löschen der Websitedaten). Server-Logs
unterliegen den Aufbewahrungsfristen der Hosting-Anbieter.

### 3.6 Rechte der betroffenen Personen

Nach Art. 15–21 DSGVO bestehen Rechte auf Auskunft, Berichtigung, Löschung,
Einschränkung, Datenübertragbarkeit und Widerspruch. Da das Projekt selbst keine
personenbezogenen Daten auf Servern speichert, betreffen solche Anfragen
typischerweise die Logs der Hosting-Anbieter. Anfragen können über das
GitHub-Repository gestellt werden.

Außerdem besteht ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde,
insbesondere der Behörde des gewöhnlichen Aufenthaltsorts.

### 3.7 Keine besonderen Datenkategorien

Das Projekt fordert keine Gesundheits-, Religions-, Gewerkschafts- oder
sonstigen besonderen Daten nach Art. 9 DSGVO an. Bitte keine solchen Daten in
öffentlichen Issues veröffentlichen.

## 4. Kein Scraping, keine Zugangsdaten

- Es findet **kein** automatisiertes Auslesen, Crawlen, Spidern oder
  Simulieren einer Anmeldung an Campo, StudOn, FAUmail, IdM oder anderen
  FAU-Systemen statt.
- Es werden **keine** FAU-Zugangsdaten, Passwörter, SSO-Token, Session-Cookies
  oder vergleichbare Authentifizierungsmittel abgefragt, gespeichert oder
  weitergegeben.
- Die akademischen Daten werden von Hand aus öffentlich veröffentlichten
  offiziellen Dokumenten übertragen und mit Quelle und Prüfdatum versehen.
- Die Anwendung führt zur Laufzeit keine Netzwerkanfragen an Dritte aus; dies
  wird durch automatisierte Tests abgesichert.

## 5. Urheberrecht, Marken und Datenbankrecht

- **Amtliche Werke:** Prüfungsordnungen und vergleichbare amtliche Dokumente
  sind nach § 5 UrhG in der Regel urheberrechtlich nicht geschützt. Die
  Übertragung erfolgt dennoch quellenbezogen und ohne Änderung des Sinngehalts.
- **Modulhandbücher und sonstige Materialien:** Diese verbleiben beim jeweiligen
  Rechteinhaber (in der Regel die FAU). Das Projekt erhebt keine Ansprüche
  daran, nutzt sie ausschließlich zur Überprüfung der Übertragung und entfernt
  sie auf begründete Anforderung des Rechteinhabers.
- **Datenbankherstellerrecht:** Es findet keine wesentliche Entnahme oder
  wesentliche Weiterverwendung aus geschützten Datenbanken im Sinne der
  §§ 87a ff. UrhG statt.
- **Marken:** „FAU“ und „Friedrich-Alexander-Universität Erlangen-Nürnberg“
  werden nur beschreibend verwendet, um den Bezug des Studiums zu benennen. Es
  werden keine Logos der FAU verwendet und keine Zugehörigkeit suggeriert.
- **Quellenangabe:** Jede angezeigte Regel verweist auf ihre offizielle Quelle
  und das Datum der letzten Prüfung.

## 6. Haftung und Gewährleistung

Die Inhalte werden mit Sorgfalt, aber ohne Gewähr erstellt. Akademische Regeln
können sich ändern; Angaben können veraltet oder unvollständig sein. Die
Anzeige ist **keine Rechts-, Prüfungs- oder Studienberatung**. Verbindlich sind
ausschließlich die offiziellen Dokumente der FAU und Campo.

Soweit gesetzlich zulässig, haftet das Projekt nicht für Schäden, die aus der
Nutzung entstehen. Unberührt bleiben die Haftung für Vorsatz und grobe
Fahrlässigkeit sowie für Schäden aus der Verletzung von Leben, Körper oder
Gesundheit. Zwingende gesetzliche Regelungen, insbesondere des
Verbraucherschutzes, bleiben anwendbar.

## 7. Anwendbares Recht

Dieser Hinweis ist vor dem Hintergrund des deutschen Rechts formuliert (DSGVO,
BDSG, TDDDG, UrhG, DDG). Zwingende Verbraucherschutzvorschriften des
gewöhnlichen Aufenthaltsorts bleiben unberührt, soweit sie günstiger sind.

## 8. Änderungen

Änderungen an diesem Hinweis werden mit Datum versehen und über die
Versionsgeschichte des Repositories nachvollziehbar dokumentiert.

---

## English summary

- Private, non-commercial student project, not affiliated with or endorsed by
  FAU. No goods or paid services are offered; for a purely private,
  non-commercial site an imprint under § 5 DDG is generally not required.
  Contact is through GitHub.
- No advertising, affiliate links, sponsorships, donations or sale of data.
- The application stores study data only in the browser (`localStorage` /
  `IndexedDB`). Nothing is uploaded; there are no accounts.
- The static hosts (Cloudflare Pages, GitHub Pages) process technically
  necessary access data such as IP address and user agent to deliver the page
  and prevent abuse (Art. 6(1)(f) GDPR).
- No analytics, tracking, pixels, fingerprinting or advertising cookies, and no
  background network requests. Local storage is strictly necessary for the
  function the user requested (§ 25(2) No. 2 TDDDG), so no consent banner is
  needed.
- No automated access to Campo, StudOn, FAUmail or any FAU system, and no
  request for FAU credentials, tokens or cookies.
- Official regulations are generally not protected under § 5 UrhG; module
  handbooks remain with their rights holder, are used only for verification and
  are removed on request. No substantial extraction from a protected database
  (§§ 87a ff. UrhG). The FAU name is used descriptively only.
- The rule display is not legal or academic advice; official FAU documents and
  Campo prevail.
- German law is the background of this notice; mandatory consumer protections
  remain unaffected.

## 中文摘要

- 本项目是私人、非商业的学生工具，与 FAU 无隶属或认可关系；不销售商品或服务，德国法下此类纯私人非商业站点通常不需要 Impressum，联系方式为 GitHub 仓库。
- 无广告、无联盟链接、无赞助、无捐赠号召，不买卖数据。
- 学习数据只存浏览器本地（`localStorage` / `IndexedDB`），不上传，无账号。
- 静态托管商（Cloudflare Pages、GitHub Pages）会处理技术上必要的访问数据（如 IP、User-Agent）用于分发与防滥用，依据 DSGVO 第 6 条第 1 款 f 项。
- 无分析、追踪、像素、指纹或广告 Cookie，也没有后台网络请求；本地存储属于实现用户所请求功能所必需（TDDDG § 25 Abs. 2 Nr. 2），因此不需要同意弹窗。
- 不自动访问 Campo、StudOn、FAUmail 或任何 FAU 系统，不索取账号、凭据、Token 或 Cookie。
- 官方考试条例通常属于 § 5 UrhG 的官方作品；模块手册版权归权利人，仅用于核对并在被要求时移除；不对受保护数据库作实质性提取（§§ 87a ff. UrhG）；FAU 名称仅作描述性使用。
- 本工具不构成法律或学业建议，以 FAU 官方文件与 Campo 为准。
- 本声明以德国法为背景，强制性消费者保护规定不受影响。

---

*This document is a good-faith description of the project's behaviour, written by
its maintainer. It is not legal advice.*
