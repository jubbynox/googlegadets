<?xml version="1.0" encoding="UTF-8" ?>
<Module>
	<ModulePrefs title="MP3 Search" scrolling="true"/>  
	<Content type="html">
		<![CDATA[
		
		<link rel="stylesheet" type="text/css" href="http://gadgets.banacek.org/mediasearch/mp3SearchStyle.css" />
		<script src="http://www.google.com/uds/api?file=uds.js&amp;v=1.0&amp;key=ABQIAAAAjFZz82Fxst0zXB3yRV-cyxQIsL_vD6NBfavXSd0hLaujD3hwXhQApYtEu2-fMGU9VHc_jm6jDIti-w" type="text/javascript"></script>
		<script src="http://gadgets.banacek.org/mediasearch/function.js"></script>
	  <form name="searchForm" method="post"  action="" onSubmit="return search(document.searchForm.searchInput.value)">
			<input type="text" name="searchInput" size="15"/>
			<input type="submit" name="searchButton" value="Search"/>
		</form>
	  <div id="searchResults"/>Loading...</div>
	  <div id="results"></div>
			
		]]>
	</Content>
</Module>