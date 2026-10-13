package pe.edu.utec.vetcare.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.edu.utec.vetcare.entity.CitaEntity;

import java.time.LocalDateTime;

public interface CitaRepository extends JpaRepository<CitaEntity, Long> {

    @Query("""
        SELECT COUNT(c) > 0
        FROM CitaEntity c
        WHERE c.veterinario.idVeterinario = :idVeterinario
        AND c.fechaCita < :finNuevaCita
        AND c.fechaCita > :inicioComparacion
    """)
    boolean existsCitaSuperpuesta(
            @Param("idVeterinario") Long idVeterinario,
            @Param("inicioComparacion") LocalDateTime inicioComparacion,
            @Param("finNuevaCita") LocalDateTime finNuevaCita
    );

    @Query("""
        SELECT COUNT(c) > 0
        FROM CitaEntity c
        WHERE c.veterinario.idVeterinario = :idVeterinario
        AND c.idCita <> :idCita
        AND c.fechaCita < :finNuevaCita
        AND c.fechaCita > :inicioComparacion
    """)
    boolean existsCitaSuperpuestaExcluyendoCita(
            @Param("idVeterinario") Long idVeterinario,
            @Param("idCita") Long idCita,
            @Param("inicioComparacion") LocalDateTime inicioComparacion,
            @Param("finNuevaCita") LocalDateTime finNuevaCita
    );

    boolean existsByVeterinario_Usuario_CorreoIgnoreCaseAndMascota_IdMascota(
            String correo,
            Long idMascota
    );

}