package pe.edu.utec.vetcare.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CitaHorarioOcupadoException.class)
    public ResponseEntity<Map<String, String>> handleCitaHorarioOcupado(
            CitaHorarioOcupadoException ex) {

        Map<String, String> response = Map.of("error", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(response);
    }

    @ExceptionHandler(EstadoCitaInvalidoException.class)
    public ResponseEntity<Map<String, String>> handleEstadoCitaInvalido(
            EstadoCitaInvalidoException ex) {

        Map<String, String> response = Map.of("error", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(response);
    }
}