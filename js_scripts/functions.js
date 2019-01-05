$(document).ready(function(){
	$("#container #to_encrypt").bind("click", to_encrypt);
		
	function to_encrypt(){
		$("#container #result").empty();
		$("#container textarea").css("border", "1px solid #bbb");
		$("#container input[name='key']").css("border", "1px solid #bbb");
		
		var open_message = $("#container textarea").val();
		if(open_message.length < 1){
			$("#container #result").append("<span>Шифрование невозможно (открытый текст отсутствует)</span>");
			$("#container textarea").css("border", "1px solid #f00");
			return;
		}
		
		var key = $("#container input[name='key']").val();
		if(key.length < 1){
			$("#container #result").append("<span>Шифрование невозможно (ключ не указан)</span>");
			$("#container input[name='key']").css("border", "1px solid #f00");
			return;
		}
		
		open_message = normalize_of_data(open_message); // нормализация исходного сообщения
		display_open_message(open_message);
		
		key = normalize_of_data(key); // нормализация ключа
		display_key(key);
		key_matrix = generate_key(key);
		key_matrix = normalize_key_matrix(key_matrix);
		display_key_matrix(key_matrix);
		
		var it_requires_one_more_iteration = true;// флажок означает, что на текущей итерации была найденна биграмма из двух одинаковых символов, а значит требуется ещё одна чтобы узнать, есть ли такие же ещё
		open_message = destroy_on_bigramms(open_message, it_requires_one_more_iteration);
		
		if(open_message.length%2 !== 0) // если последний символ является одиночный, дополняем его до биграммы
			open_message = open_message + "x";
		
		display_bigramms(open_message);
		
		// получаем шифротекст
		for(var c = 0; c < open_message.length; c = c + 2){
			var first_symbol = open_message.charAt(c);
			var second_symbol = open_message.charAt(c + 1);
			for(var i = 0; i < key_matrix.length; i++){
				for(var j = 0; j < key_matrix[i].length; j++){
					if(key_matrix[i][j] === first_symbol){
						var rows_of_first_symbol = i;		
						var cols_of_first_symbol = j;
					}
					if(key_matrix[i][j] === second_symbol){
						var rows_of_second_symbol = i;		
						var cols_of_second_symbol = j;
					}
				}					
			}
			
			if(rows_of_first_symbol === rows_of_second_symbol){
				if(cols_of_first_symbol > cols_of_second_symbol){ // если первый правее
					if(cols_of_first_symbol == 4)
						open_message = open_message.replace(open_message.charAt(c), key_matrix[rows_of_first_symbol][0]);
					else
						open_message = open_message.replace(open_message.charAt(c), key_matrix[rows_of_first_symbol][cols_of_first_symbol + 1]);
					open_message = open_message.replace(open_message.charAt(c + 1), key_matrix[rows_of_second_symbol][cols_of_second_symbol + 1]);
				}
				if(cols_of_first_symbol < cols_of_second_symbol){ // если второй правее (тут закончил, тут правильно)
					if(cols_of_second_symbol == 4)
						open_message = open_message.replace(second_symbol, key_matrix[rows_of_second_symbol][0]);
					else
						open_message = open_message.replace(second_symbol, key_matrix[rows_of_second_symbol][cols_of_second_symbol + 1]);
					open_message = open_message.replace(first_symbol, key_matrix[rows_of_first_symbol][cols_of_first_symbol + 1]);
				}
			}
			
			if(cols_of_first_symbol === cols_of_second_symbol){
				if(cols_of_first_symbol > cols_of_second_symbol){ // если первый выше
					if(rows_of_first_symbol == 4)
						open_message = open_message.replace(open_message.charAt(c), key_matrix[0][cols_of_first_symbol]);
					else
						open_message = open_message.replace(open_message.charAt(c), key_matrix[rows_of_first_symbol + 1][cols_of_first_symbol]);
					open_message = open_message.replace(open_message.charAt(c + 1), key_matrix[rows_of_second_symbol + 1][cols_of_second_symbol]);
				}
				if(cols_of_first_symbol < cols_of_second_symbol){ // если второй выше
					if(rows_of_second_symbol == 4)
						open_message = open_message.replace(open_message.charAt(c + 1), key_matrix[0][cols_of_second_symbol]);
					else
						open_message = open_message.replace(open_message.charAt(c + 1), key_matrix[rows_of_second_symbol + 1][cols_of_second_symbol]);
					open_message = open_message.replace(open_message.charAt(c), key_matrix[rows_of_first_symbol + 1][cols_of_first_symbol]);
				}
			}
		}
		/*$("#container #result").append("<br /><span><b>Сообщение: </b>" + open_message + "</span><br />");
		$("#container #result").append("<span><b>Ключ: </b>" + key_suquence + "</span><br />");
		$("#container #result").append("<span><b>Шифротекст: </b>" + ciphertext + "</span>");*/
		$("#container #result").append(open_message);
	}
	
	function normalize_of_data(data){
		data = data.toLowerCase();
		for(var i = 0; i < data.length; i++){
			var code_of_symbol = data.charCodeAt(i);
			if((code_of_symbol < 97)  || (code_of_symbol > 123)){
				data = data.replace(data.charAt(i), "");
				i--;
			}
		}
		return data;
	}
	
	function generate_key(key){
		var the_beginning_of_the_alphabet_in_the_encoding = 97;// маленькие латинские начинаются с 97 по порядку места в ACSII
		
		// генерируем латинский алфавит
		var alphabet = new Array();
		for(var i = 0; i < 26; i++){
			alphabet[i] = String.fromCharCode(the_beginning_of_the_alphabet_in_the_encoding + i);
		}
		
		// заполняем ключевую матрицу
		
		var playfair_square = new Array();
		var j = 0; // вспомогательная переменная, чтобы избежать пустых значений в массиве
		for(var c = 0; c < key.length; c++){ // сначала заполняем матрицу ключевым словом без повторения символов
			var symbol = key.charAt(c);
			var symbol_already_exist = false;
			
			for(var i = 0; i < playfair_square.length; i++){
				if(playfair_square[i] === symbol)
					symbol_already_exist = true;
			}
			
			if(symbol === "j") // мы по-прежнему избегаем присутствия j в ключевой матрице
				symbol_already_exist = true;
			
			if(symbol_already_exist === false){
				playfair_square[j] = symbol;
				j++;
			}
		}
		
		for(var c = 0; c < alphabet.length; c++){ // дополняем теперь ключевую матрицу символами латинского алфавита, которые ещё не встречались в ключевой матрице
			var symbol = alphabet[c];
			var symbol_already_exist = false;
			
			for(var i = 0; i < playfair_square.length; i++){
				if(playfair_square[i] === symbol)
					symbol_already_exist = true;
			}
			
			if(symbol === "j") // мы по-прежнему избегаем присутствия j в ключевой матрице
				symbol_already_exist = true;
				
			if(symbol_already_exist === false){
				playfair_square[j] = symbol;
				j++;
			}
		}
		return playfair_square;
	}
	
	function normalize_key_matrix(key_matrix){ // одномерный массив переводим в двумерный для удобства работы с ключом
		var tmp_key_matrix = new Array();
		var k = 0; 
		for(var i = 0; i < 5; i++){
			if(k === 30)
				break;
			tmp_key_matrix[i] = new Array();
			for(var j = 0; j < 5; j++){
				tmp_key_matrix[i][j] = key_matrix[k + j];
			}
			k = k + 5;
		}
		return tmp_key_matrix;
	}
	
	function destroy_on_bigramms(open_message, it_requires_one_more_iteration){
		it_requires_one_more_iteration = false;
		for(var i = 0; i < open_message.length; i = i + 2){
			if(open_message.charAt(i) === open_message.charAt(i + 1)){
				open_message_1_part = open_message.slice(0, i + 1);
				open_message_2_part = open_message.slice(i + 1, open_message.length);
				open_message = open_message_1_part + "x" + open_message_2_part;
				it_requires_one_more_iteration = true;
			}
		}
		if(it_requires_one_more_iteration === true)
			destroy_on_bigramms(open_message, it_requires_one_more_iteration);
		return open_message;
	}
	
	function display_open_message(open_message){
		$("#container #result").append("<br /><span><b>Сообщение: </b>" + open_message + "</span><br />");
	}
	
	function display_key(key){
		$("#container #result").append("<span><b>Ключ: </b>" + key + "</span><br />");
	}
	
	function display_key_matrix(key_matrix){
		$("#container #result").append("<span><b>Ключевая матрица:</b></span><br /> <table id='key_matrix'>");
		for(var i = 0; i < key_matrix.length; i++){
			$("#container #result #key_matrix").append("<tr>");
			for(var j = 0; j < key_matrix.length; j++){
				$("#container #result #key_matrix tr:nth-child(" + (i + 1) + ")").append("<td>" + key_matrix[i][j] + "</td>");
			}
			$("#container #result table").append("</tr>");
		}
		$("#container #result").append("</table>");
	}
	
	function display_bigramms(open_message){
		$("#container #result").append("<span><b>Биграммы:</b></span> ");
		for(var i = 0; i < open_message.length; i = i + 2){
			$("#container #result").append(open_message.charAt(i) + open_message.charAt(i + 1) + " ");
		}
		$("#container #result").append("<br />");
	}
});